"""
Attendance Models - Time & Attendance with Anti-Fraud System
"""

import uuid
from django.db import models
from django.conf import settings
from apps.core.models import OrganizationEntity


class Shift(OrganizationEntity):
    """Work shift definitions"""
    
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    branch = models.ForeignKey(
        'authentication.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='shifts',
        help_text="Branch this shift is for (null = organization-wide)"
    )
    
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Grace periods
    grace_in_minutes = models.PositiveSmallIntegerField(default=15)
    grace_out_minutes = models.PositiveSmallIntegerField(default=15)
    
    # Break
    break_duration_minutes = models.PositiveSmallIntegerField(default=60)
    
    # Working hours
    working_hours = models.DecimalField(max_digits=4, decimal_places=2, default=8.0)
    
    # Half day threshold
    half_day_hours = models.DecimalField(max_digits=4, decimal_places=2, default=4.0)
    
    # Overtime
    overtime_allowed = models.BooleanField(default=False)
    max_overtime_hours = models.DecimalField(max_digits=4, decimal_places=2, default=4.0)
    
    # Night shift
    is_night_shift = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.start_time} - {self.end_time})"


class GeoFence(OrganizationEntity):
    """Geo-fence for location-based attendance"""
    
    name = models.CharField(max_length=100)
    location = models.ForeignKey(
        'employees.Location',
        on_delete=models.CASCADE,
        related_name='geo_fences'
    )
    branch = models.ForeignKey(
        'authentication.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='geo_fences',
        help_text="Branch this geofence belongs to"
    )
    
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    radius_meters = models.PositiveIntegerField(default=200)
    
    is_primary = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['location', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.location.name})"





class AttendanceRecord(OrganizationEntity):
    """Daily attendance record"""
    
    STATUS_PRESENT = 'present'
    STATUS_ABSENT = 'absent'
    STATUS_HALF_DAY = 'half_day'
    STATUS_LATE = 'late'
    STATUS_EARLY_OUT = 'early_out'
    STATUS_ON_LEAVE = 'on_leave'
    STATUS_HOLIDAY = 'holiday'
    STATUS_WEEKEND = 'weekend'
    STATUS_WFH = 'wfh'
    
    STATUS_CHOICES = [
        (STATUS_PRESENT, 'Present'),
        (STATUS_ABSENT, 'Absent'),
        (STATUS_HALF_DAY, 'Half Day'),
        (STATUS_LATE, 'Late'),
        (STATUS_EARLY_OUT, 'Early Out'),
        (STATUS_ON_LEAVE, 'On Leave'),
        (STATUS_HOLIDAY, 'Holiday'),
        (STATUS_WEEKEND, 'Weekend'),
        (STATUS_WFH, 'Work From Home'),
    ]
    
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    branch = models.ForeignKey(
        'authentication.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='attendance_records',
        help_text="Branch where attendance was marked"
    )
    date = models.DateField(db_index=True)
    
    # Check in/out
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    
    # Calculated fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ABSENT)
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    late_minutes = models.PositiveSmallIntegerField(default=0)
    early_out_minutes = models.PositiveSmallIntegerField(default=0)
    
    # Location data
    check_in_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    check_in_longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    check_out_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    check_out_longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    # Anti-fraud
    check_in_fraud_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    check_out_fraud_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_flagged = models.BooleanField(default=False)
    
    # Device info
    device_id = models.CharField(max_length=255, blank=True)
    
    # Approval
    is_regularized = models.BooleanField(default=False)
    regularization_reason = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_attendance'
    )
    
    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['date', 'status']),
            models.Index(fields=['organization', 'date'], name='att_org_date_idx'),
            models.Index(fields=['organization', 'employee', 'date'], name='att_org_emp_date_idx'),
        ]
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.date}"


class AttendancePunch(OrganizationEntity):
    """Individual punch records (can have multiple per day)"""
    
    PUNCH_IN = 'in'
    PUNCH_OUT = 'out'
    
    PUNCH_TYPES = [
        (PUNCH_IN, 'Punch In'),
        (PUNCH_OUT, 'Punch Out'),
    ]
    
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='punches'
    )
    branch = models.ForeignKey(
        'authentication.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='punches',
        help_text="Branch where punch was marked"
    )
    attendance = models.ForeignKey(
        AttendanceRecord,
        on_delete=models.CASCADE,
        related_name='punches'
    )
    
    punch_type = models.CharField(max_length=10, choices=PUNCH_TYPES)
    punch_time = models.DateTimeField()
    
    # Location
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    accuracy = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Anti-fraud verification
    geo_fence = models.ForeignKey(
        GeoFence,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    face_verified = models.BooleanField(default=False)
    face_confidence = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    liveness_verified = models.BooleanField(default=False)
    
    # Device security
    device_id = models.CharField(max_length=255, blank=True)
    device_model = models.CharField(max_length=100, blank=True)
    is_rooted = models.BooleanField(default=False)
    is_emulator = models.BooleanField(default=False)
    is_mock_gps = models.BooleanField(default=False)
    
    # Fraud detection
    fraud_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    fraud_flags = models.JSONField(default=list, blank=True)
    
    # Photo evidence
    selfie = models.ImageField(upload_to='attendance/selfies/', null=True, blank=True)
    
    class Meta:
        ordering = ['-punch_time']
        indexes = [
            models.Index(fields=['organization', 'punch_time'], name='att_punch_org_time_idx'),
        ]
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.punch_type} at {self.punch_time}"


class FraudLog(OrganizationEntity):
    """Log of detected fraud attempts"""
    
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='fraud_logs'
    )
    punch = models.ForeignKey(
        AttendancePunch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    fraud_type = models.CharField(max_length=50, choices=[
        ('mock_gps', 'Mock GPS Detected'),
        ('rooted_device', 'Rooted/Jailbroken Device'),
        ('emulator', 'Emulator Detected'),
        ('geo_mismatch', 'Location Mismatch'),
        ('face_mismatch', 'Face Recognition Failed'),
        ('liveness_failed', 'Liveness Check Failed'),
        ('device_mismatch', 'Device ID Mismatch'),
        ('suspicious_pattern', 'Suspicious Pattern'),
        ('vpn_detected', 'VPN Detected'),
    ])
    
    severity = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ])
    
    details = models.JSONField(default=dict)
    
    # Action taken
    action_taken = models.CharField(max_length=50, blank=True)
    reviewed_by = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_frauds'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.fraud_type}"


class FaceEmbedding(OrganizationEntity):
    """Store face embeddings for recognition"""
    
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='face_embeddings'
    )
    
    embedding = models.BinaryField()  # Stored as binary
    embedding_model = models.CharField(max_length=50)  # e.g., 'facenet', 'dlib'
    
    is_primary = models.BooleanField(default=False)
    quality_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    class Meta:
        ordering = ['-is_primary', '-created_at']
    
    def __str__(self):
        return f"{self.employee.employee_id} - Face Embedding"


class ShiftAssignment(OrganizationEntity):
    """Assign shifts to employees with effective dates"""
    
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='shift_assignments'
    )
    shift = models.ForeignKey(
        Shift,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    branch = models.ForeignKey(
        'authentication.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='shift_assignments',
        help_text="Branch for this assignment"
    )
    
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True, help_text="Null means ongoing")
    
    is_primary = models.BooleanField(default=True, help_text="Primary shift for the employee")
    
    class Meta:
        ordering = ['-effective_from']
        indexes = [
            models.Index(fields=['employee', 'effective_from']),
            models.Index(fields=['shift', 'effective_from']),
        ]
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.shift.name} (from {self.effective_from})"


class OvertimeRequest(OrganizationEntity):
    """Track overtime approval workflow"""
    
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]
    
    attendance = models.ForeignKey(
        AttendanceRecord,
        on_delete=models.CASCADE,
        related_name='overtime_requests'
    )
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='overtime_requests'
    )
    branch = models.ForeignKey(
        'authentication.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='overtime_requests'
    )
    
    requested_hours = models.DecimalField(max_digits=5, decimal_places=2)
    approved_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    reason = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    
    reviewed_by = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_overtime_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.requested_hours}hrs ({self.status})"
