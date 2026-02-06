import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { UserCircleIcon, LockClosedIcon, BellIcon, GlobeAltIcon, ShieldCheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { tenantService, type SignupConfig } from '@/services/tenantService'
import { apiPatch, apiPost } from '@/services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { User } from '@/types'

const tabs = [
  { id: 'profile', name: 'Profile', icon: UserCircleIcon },
  { id: 'security', name: 'Security', icon: LockClosedIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
  { id: 'preferences', name: 'Preferences', icon: GlobeAltIcon },
]

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [config, setConfig] = useState<SignupConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [profile, setProfile] = useState({ first_name: '', last_name: '' })
  const [password, setPassword] = useState({ old: '', new: '', confirm: '' })
  const [prefs, setPrefs] = useState({ timezone: '', language: 'en', date_format: 'DD/MM/YYYY' })
  const [saving, setSaving] = useState(false)

  const [timezoneSearch, setTimezoneSearch] = useState('')
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false)
  const timezoneRef = useRef<HTMLDivElement>(null)
  const configLoadedRef = useRef(false)

  useEffect(() => {
    if (user) {
      setProfile({ first_name: user.first_name || '', last_name: user.last_name || '' })
    }
  }, [user])

  useEffect(() => {
    if (activeTab !== 'preferences' || configLoadedRef.current || isLoading) return

    const load = async () => {
      setIsLoading(true)
      try {
        const data = await tenantService.getConfig()
        console.log('Config data received:', data)
        if (!data) {
          throw new Error('No configuration data received from server')
        }
        setConfig(data)
        configLoadedRef.current = true
        if (data.timezones?.length) {
          setPrefs(p => ({ ...p, timezone: data.timezones[0] }))
        }
      } catch (e: any) {
        console.error('Failed to load settings config:', e)
        const errorMsg = e?.response?.data?.detail || e?.message || 'Failed to load settings'
        toast.error(errorMsg)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [activeTab, isLoading])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const updated = await apiPatch<User>('/auth/me/', profile)
      updateUser(updated)
      toast.success('Profile saved')
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async () => {
    if (password.new !== password.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      await apiPost('/auth/password/change/', { old_password: password.old, new_password: password.new })
      toast.success('Password updated')
      setPassword({ old: '', new: '', confirm: '' })
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const savePrefs = async () => {
    setSaving(true)
    try {
      const updated = await apiPatch<User>('/auth/me/', prefs)
      updateUser(updated)
      toast.success('Preferences saved')
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Close timezone dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timezoneRef.current && !timezoneRef.current.contains(event.target as Node)) {
        setShowTimezoneDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter timezones based on search
  const filteredTimezones = config?.timezones.filter(tz =>
    tz.toLowerCase().includes(timezoneSearch.toLowerCase())
  ) || []

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <p className="text-surface-600 dark:text-surface-400">Please log in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Settings</h1>
        <p className="text-surface-500 mt-1">Manage your account</p>
      </div>

      <div className="border-b border-surface-200 dark:border-surface-700">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center pb-4 border-b-2 ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500'}`}>
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input type="text" value={profile.first_name} onChange={e => setProfile({ ...profile, first_name: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-surface-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input type="text" value={profile.last_name} onChange={e => setProfile({ ...profile, last_name: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-surface-800" />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={saveProfile} disabled={saving} className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input type="password" value={password.old} onChange={e => setPassword({ ...password, old: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-surface-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input type="password" value={password.new} onChange={e => setPassword({ ...password, new: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-surface-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input type="password" value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-surface-800" />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={savePassword} disabled={saving} className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {['Email notifications', 'Push notifications', 'SMS alerts'].map(item => (
              <div key={item} className="flex items-center justify-between py-3">
                <span>{item}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-4">
            {isLoading ? <LoadingSpinner /> : (
              <>
                <div ref={timezoneRef} className="relative">
                  <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">Timezone</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative">
                      <input
                        type="text"
                        value={timezoneSearch || prefs.timezone}
                        onChange={(e) => {
                          setTimezoneSearch(e.target.value)
                          setShowTimezoneDropdown(true)
                        }}
                        onFocus={() => setShowTimezoneDropdown(true)}
                        placeholder="Search timezone..."
                        className="w-full px-4 py-3 pl-12 pr-4 bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 placeholder:text-surface-400 text-surface-900 dark:text-surface-100"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg shadow-sm">
                        <MagnifyingGlassIcon className="w-5 h-5 text-white" />
                      </div>
                      {timezoneSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setTimezoneSearch('')
                            setShowTimezoneDropdown(false)
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"
                        >
                          <span className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">×</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {showTimezoneDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-2xl max-h-64 overflow-hidden">
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {filteredTimezones.length > 0 ? (
                          <div className="py-2">
                            {filteredTimezones.map(tz => (
                              <button
                                key={tz}
                                type="button"
                                onClick={() => {
                                  setPrefs({ ...prefs, timezone: tz })
                                  setTimezoneSearch('')
                                  setShowTimezoneDropdown(false)
                                }}
                                className={`w-full text-left px-4 py-2.5 transition-all duration-150 flex items-center gap-3 ${
                                  prefs.timezone === tz 
                                    ? 'bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 text-primary-700 dark:text-primary-400 font-medium border-l-4 border-primary-500' 
                                    : 'hover:bg-surface-50 dark:hover:bg-surface-700/50 text-surface-700 dark:text-surface-300 border-l-4 border-transparent'
                                }`}
                              >
                                {prefs.timezone === tz && (
                                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                )}
                                <span className="flex-1">{tz}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                              <MagnifyingGlassIcon className="w-6 h-6 text-surface-400" />
                            </div>
                            <p className="text-surface-500 dark:text-surface-400 text-sm font-medium">No timezones found</p>
                            <p className="text-surface-400 dark:text-surface-500 text-xs mt-1">Try a different search term</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select value={prefs.language} onChange={e => setPrefs({ ...prefs, language: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-surface-800">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date Format</label>
                  <select value={prefs.date_format} onChange={e => setPrefs({ ...prefs, date_format: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-surface-800">
                    {config?.date_formats.map(df => <option key={df.code} value={df.code}>{df.display}</option>)}
                  </select>
                </div>
                <div className="flex justify-end">
                  <button onClick={savePrefs} disabled={saving} className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
