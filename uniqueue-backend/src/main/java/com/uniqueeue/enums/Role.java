package com.uniqueeue.enums;

public enum Role {
    /**
     * A newly-admitted student who hasn't received a matric number yet.
     * Has access to fresher-only queues (registration, hostel, orientation)
     * but is blocked from queues marked {@code matricRequired = true}.
     */
    FRESHER,

    /** A regular enrolled student with a matric number. */
    USER,

    /** Staff who serve queues. */
    STAFF,

    /** University administrator. */
    ADMIN,

    /** Platform operator managing all universities. */
    SUPER_ADMIN
}