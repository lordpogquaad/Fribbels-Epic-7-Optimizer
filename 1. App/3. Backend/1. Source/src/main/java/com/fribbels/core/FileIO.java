package com.fribbels.core;

import com.fribbels.model.HeroStats;
import com.google.gson.Gson;
import com.google.gson.stream.JsonWriter;

import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

public class FileIO {

    private static final Gson gson = new Gson();

    public String readFile(final String filename) throws IOException {
        return new String(Files.readAllBytes(Paths.get(filename)), StandardCharsets.UTF_8);
    }

    public void writeFile(final String data) throws IOException {
        Files.write(Paths.get("response.txt"), data.getBytes(StandardCharsets.UTF_8));
    }

    public void writeJsonToFile(final List<HeroStats> heroStats) throws IOException {
        try (final FileOutputStream fileOutputStream = new FileOutputStream("response.txt");
                final JsonWriter writer = new JsonWriter(
                        new OutputStreamWriter(fileOutputStream, StandardCharsets.UTF_8))) {
            writer.beginArray();
            for (int i = 0; i < heroStats.size(); i++) {
                if (i > 1000)
                    break;
                final HeroStats stat = heroStats.get(i);
                gson.toJson(stat, HeroStats.class, writer);
            }
            writer.endArray();
        }
    }

    public void writeMiniOptimizationResponsesToFile(final long[] resultInts, final long size) throws IOException {
        try (final FileOutputStream fileOutputStream = new FileOutputStream("response.txt");
                final JsonWriter writer = new JsonWriter(
                        new OutputStreamWriter(fileOutputStream, StandardCharsets.UTF_8))) {
            writer.beginArray();
            for (int i = 0; i < size; i++) {
                writer.value(resultInts[i]);
            }
            writer.endArray();
        }
    }

    public String writeString(final long[] itemIds, final long size) throws IOException {
        final ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        try (final JsonWriter writer = new JsonWriter(
                new OutputStreamWriter(byteArrayOutputStream, StandardCharsets.UTF_8))) {
            writer.beginArray();
            for (int i = 0; i < size * 6; i++) {
                writer.value(itemIds[i]);
            }
            writer.endArray();
        }
        return byteArrayOutputStream.toString();
    }
}
