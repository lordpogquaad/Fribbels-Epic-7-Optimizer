package com.fribbels.request;

import com.fribbels.model.Request;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

/**
 * Bulk roster reorder — sets the hero list order to match the given id list in
 * one
 * call (used by the Hero-grid "Auto-rank" button). Ids not present are ignored;
 * any
 * heroes omitted from the list keep their relative order at the end.
 */
@Setter
@Getter
@ToString
@NoArgsConstructor
public class ReorderAllRequest extends Request {
    private List<String> ids;
}
