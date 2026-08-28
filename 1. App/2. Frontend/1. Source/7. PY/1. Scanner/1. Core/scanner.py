"""Gear scanner: sniff Epic Seven TCP traffic (ports 3333/5222) with Scapy,
reassemble each ACK's payload, and stream the hex to stdout for the Electron
importer. Controlled over stdin ('E' = flush buffers and finish)."""

import os
import sys
import threading

# scapy.all builds its namespace dynamically, so static analysis can't see every
# name at import time (pylint's no-name-in-module, mypy's attr-defined) — they
# all resolve at runtime.
# pylint: disable-next=no-name-in-module
from scapy.all import (  # type: ignore[attr-defined]
    IP,
    Raw,
    TCP,
    TCPSession,
    get_working_ifaces,
    sniff,
)

acks: dict[int, list] = {}
loads: dict[str, bool] = {}

# Optional diagnostics: set E7_SCANNER_DEBUG=1 (see 5. Dev Only/LogControl.js header) to
# print to STDERR. NEVER use stdout for debug — stdout is the hex/delimiter data protocol
# the Electron importer parses, and extra lines there would corrupt a scan.
_DEBUG = bool(os.environ.get("E7_SCANNER_DEBUG"))


def _dbg(*args):
    if _DEBUG:
        print("[scanner]", *args, file=sys.stderr, flush=True)


def try_buffer(curr_ack):
    """Reassemble one ACK's buffered payloads (ordered by TCP seq) and emit the
    concatenated bytes as a hex line followed by a '&' delimiter."""
    buffers = acks[curr_ack]

    buffers = sorted(buffers, key=lambda x: x["seq"])
    final_buffer = b""
    for i in buffers:
        final_buffer += i["data"]

    print(final_buffer.hex())
    print("&")


def check_packet(packet):
    """Buffer a sniffed packet's TCP payload, de-duplicated by payload hash and
    grouped by ACK number, for later reassembly by try_buffer."""
    if IP in packet:
        if Raw in packet and packet[Raw].load:
            curr_ack = packet.ack
            packet_bytes = bytes(packet[Raw].load)

            if packet_bytes.hex() in loads:
                return
            loads[packet_bytes.hex()] = True

            if curr_ack in acks:
                acks[curr_ack].append({"data": packet_bytes, "seq": packet[TCP].seq})
            else:
                acks[curr_ack] = [{"data": packet_bytes, "seq": packet[TCP].seq}]


def terminate():
    """Hard-exit the process (the watchdog timer's 1-hour kill switch)."""
    os._exit(0)


def thread_sniff():
    """Background Scapy sniff loop on all working interfaces, feeding each Epic
    Seven packet to check_packet until the process exits."""
    try:
        # Epic Seven traffic was confirmed (via Wireshark) to travel over TCP
        # ports 3333 and 5222. Sniffing all working interfaces via
        # get_working_ifaces() avoids having to pick a network interface manually.
        sniff(
            iface=get_working_ifaces(),
            prn=check_packet,
            filter="tcp and ( port 5222 or port 3333 )",
            session=TCPSession,
        )
    except Exception as exc:  # pylint: disable=broad-exception-caught
        # A failed capture (no Npcap / missing perms / no matching iface) must
        # not crash this daemon thread — just stop sniffing.
        _dbg("sniff failed:", exc)


x = threading.Thread(target=thread_sniff)
x.daemon = True
x.start()
_dbg("sniffing started on tcp 3333/5222")

t = threading.Timer(3600.0, terminate)
t.start()

while True:
    line = sys.stdin.readline()
    if not line:
        # EOF: the parent closed stdin without sending 'E'. Without this guard
        # readline() returns '' forever and the loop busy-spins at 100% CPU until
        # the watchdog fires — so stop reading.
        break
    if "E" in line:
        _dbg(f"flush requested: {len(acks)} ack group(s)")
        for ack in list(acks):
            try_buffer(ack)
        print("DONE\n")
        sys.stdout.flush()
        break

# Work is done — cancel the (non-daemon) watchdog Timer so it doesn't keep the
# process alive for up to an hour after we've finished.
t.cancel()


# ── Reference notes (kept from scraps.txt for future debugging; not executed) ──
#
# Captured TCP payloads are MessagePack. A reassembled account/gear payload holds
# fields such as: personality, additional, tip, "gacha", tm, user_id, name, and an
# "info" map whose 'type' field is "equip" or "unit", plus a "code". Truncated raw
# example fragments seen on the wire:
#   ...\xa7user_id...\xa4name\xacepic7#vhldwg\xa4info\x82...equip\xa4code\xa5efh07
#   ...\xa7user_id...\xa4name\xaaMaxedcrew7\xa4info\x82...unit\xa4code\xa5c2002
#
# Downstream JS reassembly (importer side) mirrors the group-by-ack / order-by-seq
# / dedup-by-seq that check_packet() + try_buffer() do above; kept as a reference:
#
#   for (const x of d) {  // d = packets parsed from a capture log
#     (x.tcpAck in m) ? m[x.tcpAck].push(x) : (m[x.tcpAck] = [x]);  // group by ack
#   }
#   const n = Object.values(m), duplicates = {};
#   function combine(index) {
#     const arr = n[index];
#     Utils.sortByAttribute(arr, 'tcpSeq');  // order by seq
#     let data = "";
#     for (const p of arr) {
#       if (!(p.tcpSeq in duplicates)) data += p.data;  // skip duplicate seqs
#       duplicates[p.tcpSeq] = true;
#     }
#     return data;
#   }
#   finishedReading([combine(0)]);
#   // manual single-ack reassembly, skipping a bad fragment (e.g. index 13):
#   let x = ""; for (let i = 0; i < 107; i++) if (i != 13) x += n[12][i].data;
