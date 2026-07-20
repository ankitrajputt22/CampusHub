package com.campushub.college.service;

import com.campushub.college.dto.CollegeSummaryResponse;
import com.campushub.college.model.College;
import com.campushub.college.repository.CollegeRepository;
import com.campushub.common.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CollegeService {

    private final CollegeRepository collegeRepository;

    public CollegeService(CollegeRepository collegeRepository) {
        this.collegeRepository = collegeRepository;
    }

    @Transactional(readOnly = true)
    public List<CollegeSummaryResponse> search(String keyword) {
        String searchTerm = keyword == null || keyword.isBlank() ? "" : keyword.trim();
        return collegeRepository.findTop25ByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(searchTerm)
                .stream()
                .map(CollegeSummaryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public College getActiveCollege(Long collegeId) {
        return collegeRepository.findById(collegeId)
                .filter(College::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Please select your college."));
    }
}
