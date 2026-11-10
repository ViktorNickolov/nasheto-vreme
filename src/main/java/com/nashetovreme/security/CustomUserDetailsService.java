package com.nashetovreme.security;

import com.nashetovreme.user.User;
import com.nashetovreme.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Long familyId = user.getFamily() != null ? user.getFamily().getId() : null;
        return new AuthenticatedUser(
                user.getId(),
                familyId,
                user.getEmail(),
                user.getPassword(),
                user.getRole().name()
        );
    }
}

