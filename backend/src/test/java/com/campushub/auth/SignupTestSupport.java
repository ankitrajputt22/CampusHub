package com.campushub.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

public final class SignupTestSupport {

    private SignupTestSupport() {
    }

    public static void manuallyVerifyAndComplete(MockMvc mockMvc, ObjectMapper objectMapper, long userId)
            throws Exception {
        MvcResult emailResult = mockMvc.perform(post("/api/auth/signup/email/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("userId", userId))))
                .andExpect(status().isOk())
                .andReturn();
        String emailOtp = objectMapper.readTree(emailResult.getResponse().getContentAsString())
                .path("data").path("devOtp").asText();
        mockMvc.perform(post("/api/auth/signup/email/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("userId", userId, "otp", emailOtp))))
                .andExpect(status().isOk());

        MvcResult phoneResult = mockMvc.perform(post("/api/auth/signup/phone/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("userId", userId))))
                .andExpect(status().isOk())
                .andReturn();
        String phoneOtp = objectMapper.readTree(phoneResult.getResponse().getContentAsString())
                .path("data").path("devOtp").asText();
        mockMvc.perform(post("/api/auth/signup/phone/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("userId", userId, "otp", phoneOtp))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/signup/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("userId", userId))))
                .andExpect(status().isOk());
    }
}
