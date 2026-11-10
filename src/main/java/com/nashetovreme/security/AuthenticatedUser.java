package com.nashetovreme.security;

import java.util.Collection;
import java.util.List;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
public class AuthenticatedUser implements UserDetails {

    private final Long id;
    private final Long familyId;
    private final String username;
    private final String password;
    private final List<SimpleGrantedAuthority> authorities;

    public AuthenticatedUser(Long id, Long familyId, String username, String password, String role) {
        this.id = id;
        this.familyId = familyId;
        this.username = username;
        this.password = password;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}

