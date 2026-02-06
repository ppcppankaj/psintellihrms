"""
Leave Models - Leave Management
"""

import uuid
from django.db import models
from apps.core.models import OrganizationEntity


class LeaveType(OrganizationEntity):
    """Leave type definitions"""
    
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    
    # Accrual settings
    annual_quota = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    accrual_type = models.CharField(max_length=20, choices=[
        ('yearly', 'Yearly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('none', 'No Accrual'),
    ], default='none')
    
    # Carry forward
    carry_forward_allowed = models.BooleanField(default=False)
    max_carry_forward = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    
    # Encashment
    encashment_allowed = models.BooleanField(default=False)
    max_encashment = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    
    # Settings
    is_paid = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=True)
    requires_attachment = models.BooleanField(default=False)
    min_days_notice = models.PositiveSmallIntegerField(default=0)
    max_consecutive_days = models.PositiveSmallIntegerField(null=True, blank=True)
    
    # Applicability
    applicable_gender = models.CharField(max_length=20, blank=True)  # '', 'male', 'female'
    applicable_after_months = models.PositiveSmallIntegerField(default=0)
    
    # Color for UI
    color = models.CharField(max_length=8, default='#1976D2')
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class LeavePolicy(OrganizationEntity):
    """Leave policy for groups of employees"""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Settings
    sandwich_rule = models.BooleanField(default=False)  # Count weekends/holidays in between
    probation_leave_allowed = models.BooleanField(default=False)
    negative_balance_allowed = models.BooleanField(default=False)
    max_negative_balance = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    
    # Holiday handling
    count_holidays = models.BooleanField(default=False)
    count_weekends = models.BooleanField(default=False)
    
    class Meta:
        verbose_name_plural = 'Leave Policies'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class LeaveBalance(OrganizationEntity):
    """Employee leave balance per type"""
    
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='leave_balances'
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.CASCADE,
        related_name='balances'
    )
    
    year = models.PositiveSmallIntegerField()
    
    # Balance
    opening_balance = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    accrued = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    taken = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    adjustment = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    carry_forward = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    encashed = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    
    class Meta:
        unique_together = ['employee', 'leave_type', 'year']
        ordering = ['-year', 'leave_type']
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type.name} ({self.year})"
    
    @property
    def available_balance(self):
        return self.opening_balance + self.accrued + self.carry_forward + self.adjustment - self.taken - self.encashed


class LeaveRequest(OrganizationEntity):
    """Leave application"""
    
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CANCELLED = 'cancelled'
    STATUS_REVOKED = 'revoked'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_REVOKED, 'Revoked'),
    ]
    
    DAY_FULL = 'full'
    DAY_FIRST_HALF = 'first_half'
    DAY_SECOND_HALF = 'second_half'
    
    DAY_CHOICES = [
        (DAY_FULL, 'Full Day'),
        (DAY_FIRST_HALF, 'First Half'),
        (DAY_SECOND_HALF, 'Second Half'),
    ]
    
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='leave_requests'
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.PROTECT,
        related_name='requests'
    )
    branch = models.ForeignKey(
        'authentication.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='leave_requests',
        help_text="Branch of the employee"
    )
    
    start_date = models.DateField()
    end_date = models.DateField()
    start_day_type = models.CharField(max_length=20, choices=DAY_CHOICES, default=DAY_FULL)
    end_day_type = models.CharField(max_length=20, choices=DAY_CHOICES, default=DAY_FULL)
    
    total_days = models.DecimalField(max_digits=5, decimal_places=1)
    reason = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    
    # Contact during leave
    contact_number = models.CharField(max_length=15, blank=True)
    contact_address = models.TextField(blank=True)
    
    # Attachments
    attachment = models.FileField(upload_to='leave_attachments/', null=True, blank=True)
    
    # Approval workflow
    current_approver = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pending_leave_approvals'
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type.name} ({self.start_date} to {self.end_date})"


class LeaveApproval(OrganizationEntity):
    """Leave approval history"""
    
    leave_request = models.ForeignKey(
        LeaveRequest,
        on_delete=models.CASCADE,
        related_name='approvals'
    )
    approver = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        related_name='leave_approvals'
    )
    branch = models.ForeignKey(
        'authentication.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='leave_approvals',
        help_text="Branch where approval occurred"
    )
    
    level = models.PositiveSmallIntegerField(default=1)
    action = models.CharField(max_length=20, choices=[
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('forwarded', 'Forwarded'),
    ])
    comments = models.TextField(blank=True)
    
    class Meta:
        ordering = ['level', 'created_at']
    
    def __str__(self):
        return f"{self.leave_request} - Level {self.level} - {self.action}"


class Holiday(OrganizationEntity):
    """Holiday calendar"""
    
    name = models.CharField(max_length=100)
    date = models.DateField()
    branch = models.ForeignKey(
        'authentication.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='holidays',
        help_text="Branch-specific holiday (null = organization-wide)"
    )
    
    is_optional = models.BooleanField(default=False)
    is_restricted = models.BooleanField(default=False)  # Restricted/floating holiday
    
    # Location-specific
    locations = models.ManyToManyField(
        'employees.Location',
        blank=True,
        related_name='holidays'
    )
    
    class Meta:
        ordering = ['date']
    
    def __str__(self):
        return f"{self.name} ({self.date})"


class LeaveEncashment(OrganizationEntity):
    """
    Leave encashment request.
    Allows employees to encash unused leaves for monetary compensation.
    """
    STATUS_DRAFT = 'draft'
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_PROCESSED = 'processed'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_PENDING, 'Pending Approval'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_PROCESSED, 'Processed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]
    
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='leave_encashments'
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.PROTECT,
        related_name='encashments'
    )
    
    # Encashment details
    year = models.PositiveSmallIntegerField()
    days_requested = models.DecimalField(max_digits=5, decimal_places=1)
    days_approved = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    
    # Calculation
    per_day_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    
    # Approval
    approved_by = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_encashments'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Payment
    paid_in_payroll = models.ForeignKey(
        'payroll.PayrollRun',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='leave_encashments'
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type.code} - {self.days_requested} days"


class CompensatoryLeave(OrganizationEntity):
    """
    Compensatory off for working on holidays/weekends.
    """
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_USED = 'used'
    STATUS_EXPIRED = 'expired'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending Approval'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_USED, 'Used'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]
    
    WORK_TYPE_HOLIDAY = 'holiday'
    WORK_TYPE_WEEKEND = 'weekend'
    WORK_TYPE_OVERTIME = 'overtime'
    
    WORK_TYPE_CHOICES = [
        (WORK_TYPE_HOLIDAY, 'Holiday Working'),
        (WORK_TYPE_WEEKEND, 'Weekend Working'),
        (WORK_TYPE_OVERTIME, 'Overtime (Extra Hours)'),
    ]
    
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='compensatory_leaves'
    )
    
    # Work details
    work_date = models.DateField()
    work_type = models.CharField(max_length=20, choices=WORK_TYPE_CHOICES)
    reason = models.TextField(help_text="Reason for working on off-day")
    
    # Hours worked (for overtime-based)
    hours_worked = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Comp-off credit
    days_credited = models.DecimalField(
        max_digits=3, decimal_places=1,
        default=1,
        help_text="Days to credit (0.5 for half day, 1 for full day)"
    )
    
    # Validity
    expiry_date = models.DateField(null=True, blank=True, help_text="Date by which comp-off must be used")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    
    # Approval
    approved_by = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_comp_offs'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Usage tracking
    used_in_leave_request = models.ForeignKey(
        LeaveRequest,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='compensatory_leaves_used'
    )
    
    class Meta:
        ordering = ['-work_date']
    
    def __str__(self):
        return f"{self.employee.employee_id} - Comp-off for {self.work_date}"


class HolidayCalendar(OrganizationEntity):
    """
    Named holiday calendar for organizing holidays by region/year.
    """
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    country = models.CharField(max_length=50, default='India')
    year = models.PositiveSmallIntegerField()
    description = models.TextField(blank=True)
    
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Regional associations
    locations = models.ManyToManyField(
        'employees.Location',
        blank=True,
        related_name='holiday_calendars'
    )
    
    class Meta:
        ordering = ['-year', 'name']
        unique_together = ['code', 'year']
    
    def __str__(self):
        return f"{self.name} ({self.year})"


class HolidayCalendarEntry(OrganizationEntity):
    """
    Individual holiday entries in a calendar.
    """
    calendar = models.ForeignKey(
        HolidayCalendar,
        on_delete=models.CASCADE,
        related_name='entries'
    )
    
    name = models.CharField(max_length=100)
    date = models.DateField()
    day_of_week = models.CharField(max_length=10, blank=True)
    
    is_optional = models.BooleanField(default=False)
    is_restricted = models.BooleanField(default=False, help_text="Restricted/floating holiday")
    
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['date']
        unique_together = ['calendar', 'date']
    
    def __str__(self):
        return f"{self.name} - {self.date}"
    
    def save(self, *args, **kwargs):
        # Auto-set day of week
        if self.date:
            self.day_of_week = self.date.strftime('%A')
        super().save(*args, **kwargs)

