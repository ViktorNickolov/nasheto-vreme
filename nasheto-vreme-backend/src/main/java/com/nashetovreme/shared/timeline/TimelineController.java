package com.nashetovreme.shared.timeline;

import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.shared.timeline.dto.TimelineItemResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping
    public List<TimelineItemResponse> getTimeline(@RequestParam(required = false) Long familyId,
                                                  @RequestParam(required = false, defaultValue = "ALL") String type,
                                                  @RequestParam(required = false, defaultValue = "50") int limit,
                                                  @AuthenticationPrincipal AuthenticatedUser user) {
        return timelineService.getTimeline(familyId, type, limit, user);
    }
}

