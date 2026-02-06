"""
Attendance Services - Geo-fence, Fraud Detection, Verification
"""

import math
from decimal import Decimal
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from django.utils import timezone
from django.db.models import Q


class GeoFenceService:
    """
    Geo-fence validation service.
    Validates if punch location is within allowed geo-fences.
    """
    
    # Earth radius in meters
    EARTH_RADIUS_M = 6371000
    
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula.
        Returns distance in meters.
        """
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return GeoFenceService.EARTH_RADIUS_M * c
    
    @classmethod
    def validate_location(
        cls,
        employee,
        latitude: float,
        longitude: float,
        accuracy: float = None
    ) -> Dict:
        """
        Validate if employee location is within any allowed geo-fence.
        
        Returns:
            {
                'valid': bool,
                'geo_fence': GeoFence or None,
                'distance_meters': float,
                'message': str
            }
        """
        from apps.attendance.models import GeoFence
        
        # Get geo-fences for employee's location
        geo_fences = []
        
        # Primary geo-fence from employee's location
        if employee.location_id:
            geo_fences = list(GeoFence.objects.filter(
                location_id=employee.location_id,
                is_active=True
            ))
        
        if not geo_fences:
            # No geo-fences configured - allow punch
            return {
                'valid': True,
                'geo_fence': None,
                'distance_meters': 0,
                'message': 'No geo-fence configured - punch allowed'
            }
        
        # Check each geo-fence
        best_match = None
        min_distance = float('inf')
        
        for geo_fence in geo_fences:
            distance = cls.haversine_distance(
                latitude, longitude,
                float(geo_fence.latitude), float(geo_fence.longitude)
            )
            
            if distance < min_distance:
                min_distance = distance
                best_match = geo_fence
            
            # Check if within radius (considering accuracy)
            effective_radius = geo_fence.radius_meters
            if accuracy and accuracy > 0:
                effective_radius += accuracy  # Allow for GPS inaccuracy
            
            if distance <= effective_radius:
                return {
                    'valid': True,
                    'geo_fence': geo_fence,
                    'distance_meters': distance,
                    'message': f'Within geo-fence: {geo_fence.name}'
                }
        
        # Not within any geo-fence
        return {
            'valid': False,
            'geo_fence': best_match,
            'distance_meters': min_distance,
            'message': f'Outside geo-fence. Nearest: {best_match.name} ({min_distance:.0f}m away)'
        }


class FraudDetectionService:
    """
    Fraud detection service for attendance punches.
    Calculates fraud score based on multiple factors.
    """
    
    # Fraud score weights
    WEIGHTS = {
        'mock_gps': 30,
        'rooted_device': 20,
        'emulator': 25,
        'geo_mismatch': 15,
        'device_mismatch': 10,
        'vpn_detected': 10,
        'suspicious_timing': 10,
        'face_mismatch': 20,
        'liveness_failed': 25,
    }
    
    @classmethod
    def calculate_fraud_score(
        cls,
        employee,
        punch_data: Dict,
        previous_punches: List = None
    ) -> Tuple[Decimal, List[str]]:
        """
        Calculate fraud score for a punch.
        
        Returns:
            (fraud_score: Decimal, fraud_flags: List[str])
        """
        score = 0
        flags = []
        
        # Mock GPS detection
        if punch_data.get('is_mock_gps'):
            score += cls.WEIGHTS['mock_gps']
            flags.append('mock_gps')
        
        # Rooted/jailbroken device
        if punch_data.get('is_rooted'):
            score += cls.WEIGHTS['rooted_device']
            flags.append('rooted_device')
        
        # Emulator detection
        if punch_data.get('is_emulator'):
            score += cls.WEIGHTS['emulator']
            flags.append('emulator')
        
        # Device mismatch (using different device than usual)
        if punch_data.get('device_id'):
            if cls._is_device_mismatch(employee, punch_data['device_id']):
                score += cls.WEIGHTS['device_mismatch']
                flags.append('device_mismatch')
        
        # Geo-fence mismatch
        if punch_data.get('geo_valid') is False:
            score += cls.WEIGHTS['geo_mismatch']
            flags.append('geo_mismatch')
        
        # Suspicious timing patterns
        if previous_punches:
            if cls._has_suspicious_timing(previous_punches, punch_data.get('punch_time')):
                score += cls.WEIGHTS['suspicious_timing']
                flags.append('suspicious_timing')
        
        # Face verification failed
        if punch_data.get('face_verified') is False:
            score += cls.WEIGHTS['face_mismatch']
            flags.append('face_mismatch')
        
        # Liveness check failed
        if punch_data.get('liveness_verified') is False:
            score += cls.WEIGHTS['liveness_failed']
            flags.append('liveness_failed')
        
        # Normalize score to 0-100
        fraud_score = min(Decimal(score), Decimal(100))
        
        return fraud_score, flags
    
    @classmethod
    def _is_device_mismatch(cls, employee, device_id: str) -> bool:
        """Check if device is different from usual"""
        from apps.attendance.models import AttendancePunch
        
        # Get last 10 punches
        recent_devices = AttendancePunch.objects.filter(
            employee=employee,
            device_id__isnull=False
        ).exclude(
            device_id=''
        ).order_by('-punch_time')[:10].values_list('device_id', flat=True)
        
        if not recent_devices:
            return False  # No history, can't determine mismatch
        
        # If current device not in recent devices, it's a mismatch
        return device_id not in recent_devices
    
    @classmethod
    def _has_suspicious_timing(cls, previous_punches, current_time: datetime) -> bool:
        """Detect suspicious timing patterns"""
        if not previous_punches or not current_time:
            return False
        
        # Check for too-rapid punches (less than 5 minutes apart)
        for punch in previous_punches[:3]:
            time_diff = abs((current_time - punch.punch_time).total_seconds())
            if time_diff < 300:  # 5 minutes
                return True
        
        return False
    
    @classmethod
    def should_flag_for_review(cls, fraud_score: Decimal) -> bool:
        """Determine if punch should be flagged for review"""
        return fraud_score >= 30
    
    @classmethod
    def get_severity(cls, fraud_score: Decimal) -> str:
        """Get severity level based on fraud score"""
        if fraud_score >= 70:
            return 'critical'
        elif fraud_score >= 50:
            return 'high'
        elif fraud_score >= 30:
            return 'medium'
        return 'low'


class AttendanceService:
    """
    Core attendance service for punch operations.
    """
    
    @classmethod
    def punch_in(cls, employee, punch_data: Dict) -> Dict:
        """
        Process punch-in request.
        
        Args:
            employee: Employee instance
            punch_data: {
                'latitude': float,
                'longitude': float,
                'accuracy': float,
                'device_id': str,
                'device_model': str,
                'is_rooted': bool,
                'is_emulator': bool,
                'is_mock_gps': bool,
                'selfie': file (optional),
            }
        
        Returns:
            {
                'success': bool,
                'message': str,
                'attendance': AttendanceRecord or None,
                'punch': AttendancePunch or None,
                'fraud_score': float,
                'warnings': list,
            }
        """
        from apps.attendance.models import AttendanceRecord, AttendancePunch, FraudLog
        
        today = timezone.localdate()
        warnings = []
        
        # Get or create attendance record
        attendance, created = AttendanceRecord.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={'device_id': punch_data.get('device_id', '')}
        )
        
        # Check if already punched in
        if attendance.check_in and not attendance.check_out:
            return {
                'success': False,
                'message': 'Already punched in. Please punch out first.',
                'attendance': attendance,
                'punch': None,
                'fraud_score': 0,
                'warnings': ['Already punched in']
            }
        
        # Validate geo-fence
        geo_result = GeoFenceService.validate_location(
            employee,
            punch_data.get('latitude'),
            punch_data.get('longitude'),
            punch_data.get('accuracy')
        )
        punch_data['geo_valid'] = geo_result['valid']
        
        if not geo_result['valid']:
            warnings.append(geo_result['message'])
        
        # Get previous punches for fraud detection
        previous_punches = list(AttendancePunch.objects.filter(
            employee=employee
        ).order_by('-punch_time')[:5])
        
        # Calculate fraud score
        fraud_score, fraud_flags = FraudDetectionService.calculate_fraud_score(
            employee, punch_data, previous_punches
        )
        
        # Create punch record
        punch_time = timezone.now()
        punch = AttendancePunch.objects.create(
            employee=employee,
            attendance=attendance,
            punch_type=AttendancePunch.PUNCH_IN,
            punch_time=punch_time,
            latitude=punch_data.get('latitude'),
            longitude=punch_data.get('longitude'),
            accuracy=punch_data.get('accuracy'),
            geo_fence=geo_result.get('geo_fence'),
            device_id=punch_data.get('device_id', ''),
            device_model=punch_data.get('device_model', ''),
            is_rooted=punch_data.get('is_rooted', False),
            is_emulator=punch_data.get('is_emulator', False),
            is_mock_gps=punch_data.get('is_mock_gps', False),
            fraud_score=fraud_score,
            fraud_flags=fraud_flags,
            selfie=punch_data.get('selfie'),
        )
        
        # Update attendance record
        attendance.check_in = punch_time
        attendance.check_in_latitude = punch_data.get('latitude')
        attendance.check_in_longitude = punch_data.get('longitude')
        attendance.check_in_fraud_score = fraud_score
        attendance.device_id = punch_data.get('device_id', '')
        
        # Check if late
        shift = cls._get_employee_shift(employee)
        if shift:
            late_minutes = cls._calculate_late_minutes(punch_time, shift)
            if late_minutes > 0:
                attendance.late_minutes = late_minutes
                attendance.status = AttendanceRecord.STATUS_LATE
                warnings.append(f'Late by {late_minutes} minutes')
            else:
                attendance.status = AttendanceRecord.STATUS_PRESENT
        else:
            attendance.status = AttendanceRecord.STATUS_PRESENT
        
        # Flag if fraud detected
        if FraudDetectionService.should_flag_for_review(fraud_score):
            attendance.is_flagged = True
            warnings.append('Flagged for review due to potential fraud indicators')
            
            # Create fraud log
            for flag in fraud_flags:
                FraudLog.objects.create(
                    employee=employee,
                    punch=punch,
                    fraud_type=flag,
                    severity=FraudDetectionService.get_severity(fraud_score),
                    details={
                        'fraud_score': float(fraud_score),
                        'location': {
                            'lat': punch_data.get('latitude'),
                            'lng': punch_data.get('longitude'),
                        },
                        'device_id': punch_data.get('device_id'),
                    }
                )
        
        attendance.save()
        
        return {
            'success': True,
            'message': 'Punch in successful',
            'attendance': attendance,
            'punch': punch,
            'fraud_score': float(fraud_score),
            'warnings': warnings,
        }
    
    @classmethod
    def punch_out(cls, employee, punch_data: Dict) -> Dict:
        """Process punch-out request"""
        from apps.attendance.models import AttendanceRecord, AttendancePunch, FraudLog
        
        today = timezone.localdate()
        warnings = []
        
        # Get attendance record
        try:
            attendance = AttendanceRecord.objects.get(employee=employee, date=today)
        except AttendanceRecord.DoesNotExist:
            return {
                'success': False,
                'message': 'No punch-in found for today. Please punch in first.',
                'attendance': None,
                'punch': None,
                'fraud_score': 0,
                'warnings': ['No punch-in record'],
            }
        
        if not attendance.check_in:
            return {
                'success': False,
                'message': 'No punch-in found. Please punch in first.',
                'attendance': attendance,
                'punch': None,
                'fraud_score': 0,
                'warnings': ['No punch-in record'],
            }
        
        if attendance.check_out:
            return {
                'success': False,
                'message': 'Already punched out for today.',
                'attendance': attendance,
                'punch': None,
                'fraud_score': 0,
                'warnings': ['Already punched out'],
            }
        
        # Validate geo-fence
        geo_result = GeoFenceService.validate_location(
            employee,
            punch_data.get('latitude'),
            punch_data.get('longitude'),
            punch_data.get('accuracy')
        )
        punch_data['geo_valid'] = geo_result['valid']
        
        if not geo_result['valid']:
            warnings.append(geo_result['message'])
        
        # Calculate fraud score
        previous_punches = list(AttendancePunch.objects.filter(
            employee=employee
        ).order_by('-punch_time')[:5])
        
        fraud_score, fraud_flags = FraudDetectionService.calculate_fraud_score(
            employee, punch_data, previous_punches
        )
        
        # Create punch record
        punch_time = timezone.now()
        punch = AttendancePunch.objects.create(
            employee=employee,
            attendance=attendance,
            punch_type=AttendancePunch.PUNCH_OUT,
            punch_time=punch_time,
            latitude=punch_data.get('latitude'),
            longitude=punch_data.get('longitude'),
            accuracy=punch_data.get('accuracy'),
            geo_fence=geo_result.get('geo_fence'),
            device_id=punch_data.get('device_id', ''),
            device_model=punch_data.get('device_model', ''),
            is_rooted=punch_data.get('is_rooted', False),
            is_emulator=punch_data.get('is_emulator', False),
            is_mock_gps=punch_data.get('is_mock_gps', False),
            fraud_score=fraud_score,
            fraud_flags=fraud_flags,
            selfie=punch_data.get('selfie'),
        )
        
        # Update attendance record
        attendance.check_out = punch_time
        attendance.check_out_latitude = punch_data.get('latitude')
        attendance.check_out_longitude = punch_data.get('longitude')
        attendance.check_out_fraud_score = fraud_score
        
        # Calculate total hours
        total_seconds = (attendance.check_out - attendance.check_in).total_seconds()
        total_hours = Decimal(total_seconds) / Decimal(3600)
        attendance.total_hours = total_hours.quantize(Decimal('0.01'))
        
        # Check for half day / early out
        shift = cls._get_employee_shift(employee)
        if shift:
            early_out_mins = cls._calculate_early_out_minutes(punch_time, shift)
            if early_out_mins > 0:
                attendance.early_out_minutes = early_out_mins
            
            if total_hours < shift.half_day_hours:
                attendance.status = AttendanceRecord.STATUS_HALF_DAY
                warnings.append('Marked as half day due to insufficient hours')
            
            # Calculate overtime
            if shift.overtime_allowed:
                if total_hours > shift.working_hours:
                    overtime = total_hours - shift.working_hours
                    attendance.overtime_hours = min(overtime, shift.max_overtime_hours).quantize(Decimal('0.01'))
        
        # Flag if fraud detected
        if FraudDetectionService.should_flag_for_review(fraud_score):
            attendance.is_flagged = True
            
            for flag in fraud_flags:
                FraudLog.objects.create(
                    employee=employee,
                    punch=punch,
                    fraud_type=flag,
                    severity=FraudDetectionService.get_severity(fraud_score),
                    details={
                        'fraud_score': float(fraud_score),
                        'location': {
                            'lat': punch_data.get('latitude'),
                            'lng': punch_data.get('longitude'),
                        },
                    }
                )
        
        attendance.save()
        
        return {
            'success': True,
            'message': 'Punch out successful',
            'attendance': attendance,
            'punch': punch,
            'fraud_score': float(fraud_score),
            'warnings': warnings,
        }
    
    @classmethod
    def _get_employee_shift(cls, employee):
        """Get employee's assigned shift"""
        # TODO: Implement shift assignment logic
        from apps.attendance.models import Shift
        return Shift.objects.filter(code='GEN', is_active=True).first()
    
    @classmethod
    def _calculate_late_minutes(cls, punch_time: datetime, shift) -> int:
        """Calculate late minutes based on shift"""
        if not shift:
            return 0
        
        # Get shift start time for today
        shift_start = datetime.combine(punch_time.date(), shift.start_time)
        shift_start = timezone.make_aware(shift_start)
        
        # Add grace period
        grace_end = shift_start + timedelta(minutes=shift.grace_in_minutes)
        
        if punch_time > grace_end:
            late_seconds = (punch_time - grace_end).total_seconds()
            return int(late_seconds // 60)
        
        return 0
    
    @classmethod
    def _calculate_early_out_minutes(cls, punch_time: datetime, shift) -> int:
        """Calculate early out minutes"""
        if not shift:
            return 0
        
        shift_end = datetime.combine(punch_time.date(), shift.end_time)
        shift_end = timezone.make_aware(shift_end)
        
        # Subtract grace period
        grace_start = shift_end - timedelta(minutes=shift.grace_out_minutes)
        
        if punch_time < grace_start:
            early_seconds = (grace_start - punch_time).total_seconds()
            return int(early_seconds // 60)
        
        return 0
