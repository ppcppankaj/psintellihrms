import React from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Shield } from 'lucide-react';
import { useAppSelector } from '../../store';
import type { RootState } from '../../store';

const Profile: React.FC = () => {
    const { user } = useAppSelector((state: RootState) => state.auth);

    const infoGroups = [
        {
            title: 'Personal Information',
            items: [
                { label: 'Full Name', value: `${user?.first_name} ${user?.last_name}`, icon: User },
                { label: 'Email Address', value: user?.email, icon: Mail },
                { label: 'Phone Number', value: '+1 234 567 890', icon: Phone },
            ]
        },
        {
            title: 'Employment Details',
            items: [
                { label: 'Employee ID', value: user?.employee_id, icon: Briefcase },
                { label: 'Department', value: user?.organization?.name, icon: MapPin },
                { label: 'Designation', value: 'Employee', icon: Shield },
                { label: 'Phone', value: user?.phone, icon: Phone },
            ]
        }
    ];

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center space-x-6 p-6 bg-white border border-slate-200 rounded-xl">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                    <User size={48} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{user?.first_name} {user?.last_name}</h1>
                    <p className="text-slate-500 font-medium">{user?.email}</p>
                    <span className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase">
                        Active
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {infoGroups.map((group) => (
                    <div key={group.title} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="font-semibold text-slate-800">{group.title}</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {group.items.map((item) => (
                                <div key={item.label} className="flex items-start space-x-3">
                                    <div className="mt-1 p-1.5 bg-slate-100 rounded text-slate-500">
                                        {item.icon && <item.icon size={16} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{item.label}</p>
                                        <p className="text-slate-900 font-medium">{item.value || 'Not specified'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


export default Profile;
