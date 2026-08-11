package com.campushub.security;

import com.campushub.auth.service.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler
    ) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/colleges/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/check-username").permitAll()
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/user/profile/photo/content/**",
                                "/api/listings/images/**"
                        ).permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/check-email",
                                "/api/auth/check-phone",
                                "/api/auth/signup/start",
                                "/api/auth/signup/email/send-otp",
                                "/api/auth/signup/email/verify-otp",
                                "/api/auth/signup/phone/send-otp",
                                "/api/auth/signup/phone/verify-otp",
                                "/api/auth/signup/complete",
                                "/api/auth/send-email-otp",
                                "/api/auth/send-phone-otp",
                                "/api/auth/verify-signup-otp",
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/logout",
                                "/api/auth/password-reset/request",
                                "/api/auth/password-reset/verify",
                                "/api/auth/password-reset/complete"
                        ).permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/public/support/contact"
                        ).permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/logout-all-devices"
                        ).authenticated()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/api/super-admin/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/support/attachments/**"
                        ).authenticated()
                        .requestMatchers("/api/support/**").hasRole("STUDENT")
                        .requestMatchers("/api/student/**").hasRole("STUDENT")
                        .requestMatchers("/api/user/**").hasRole("STUDENT")
                        .requestMatchers("/api/users/**").hasRole("STUDENT")
                        .requestMatchers(
                                "/api/colleges/explore",
                                "/api/colleges/explore/**"
                        ).hasRole("STUDENT")
                        .requestMatchers("/api/listings/**").hasRole("STUDENT")
                        .requestMatchers("/api/wishlist/**").hasRole("STUDENT")
                        .requestMatchers("/api/reports/**").hasRole("STUDENT")
                        .requestMatchers("/api/orders/**").hasRole("STUDENT")
                        .requestMatchers("/api/payments/**").hasRole("STUDENT")
                        .requestMatchers("/api/reviews/**").hasRole("STUDENT")
                        .requestMatchers("/api/chats/**").hasRole("STUDENT")
                        .requestMatchers(
                                "/api/notifications",
                                "/api/notifications/**"
                        ).authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtTokenService jwtTokenService) {
        return new JwtAuthenticationFilter(jwtTokenService);
    }

    @Bean
    public RestAuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
        return new RestAuthenticationEntryPoint(objectMapper);
    }

    @Bean
    public RestAccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
        return new RestAccessDeniedHandler(objectMapper);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
