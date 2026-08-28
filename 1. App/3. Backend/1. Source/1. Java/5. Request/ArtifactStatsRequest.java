package com.fribbels.request;

import com.fribbels.model.ArtifactStats;
import com.fribbels.model.Request;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.util.Map;

@Getter
@Builder
@ToString
public class ArtifactStatsRequest extends Request {

    final Map<String, ArtifactStats> artifactStatsByName;
}
