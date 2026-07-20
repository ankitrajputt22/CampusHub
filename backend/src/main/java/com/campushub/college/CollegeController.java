package com.campushub.college;

import com.campushub.college.dto.CollegeSummaryResponse;
import com.campushub.college.service.CollegeService;
import com.campushub.common.api.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/colleges")
public class CollegeController {

    private final CollegeService collegeService;

    public CollegeController(CollegeService collegeService) {
        this.collegeService = collegeService;
    }

    @GetMapping("/search")
    public ApiResponse<List<CollegeSummaryResponse>> searchColleges(
            @RequestParam(name = "keyword", required = false) String keyword
    ) {
        return ApiResponse.success("Colleges fetched successfully", collegeService.search(keyword));
    }
}
