import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { api } from '../lib/utils'
import useGetMyProfile from '@/lib/queries'
import Loader from '@/components/loader'

const DTU_BRANCHES = [
  'Computer Science and Engineering',
  'Information Technology',
  'Software Engineering',
  'Mathematics and Computing',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Engineering Physics',
  'Mechanical Engineering',
  'Production and Industrial Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Environmental Engineering',
  'Biotechnology',
  'BBA',
  'MBA',
  'PHD',
  'M.Tech',
  'B.Com',
  'Others'
]

export default function ProfileSetup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {data: profile, isPending} = useGetMyProfile()

  // Use profile data directly with fallbacks - no local state needed
  const currentFormData = {
    name: profile?.user.name || '',
    username: profile?.user.username || '',
    bio: profile?.user.bio || '',
    graduationYear: profile?.user.graduationYear?.toString() || '',
    branch: profile?.user.branch || '',
    currentCompany: profile?.user.currentCompany || '',
    currentRole: profile?.user.currentRole || '',
    linkedinUrl: profile?.user.linkedinUrl || ''
  }

  const [formData, setFormData] = useState(currentFormData)

  // Sync form data when profile changes, but only if form hasn't been modified
  const [hasUserModified, setHasUserModified] = useState(false)
  
  // Update form data when profile loads, but only if user hasn't started editing
  if (profile && !hasUserModified && JSON.stringify(formData) === JSON.stringify({
    name: '',
    username: '',
    bio: '',
    graduationYear: '',
    branch: '',
    currentCompany: '',
    currentRole: '',
    linkedinUrl: ''
  })) {
    setFormData(currentFormData)
  }

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.users.profile.$patch({
        json: {
          ...data,
          graduationYear: data.graduationYear ? parseInt(data.graduationYear) : undefined,
          linkedinUrl: data.linkedinUrl || undefined
        }
      })
      if (!res.ok) {
        throw new Error('Failed to update profile')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      navigate('/')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setHasUserModified(true)
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isPending) return <Loader /> 
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Alumni Profile</CardTitle>
            <CardDescription>
              Help fellow DTU alumni connect with you by completing your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe"
                    required
                    minLength={4}
                    maxLength={50}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="@johndoe"
                    required
                    minLength={4}
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year *</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    min="1940"
                    max={new Date().getFullYear()+6}
                    value={formData.graduationYear}
                    onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                    placeholder="2020"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select 
                    value={formData.branch} 
                    onValueChange={(value) => handleInputChange('branch', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your branch" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 overflow-y-auto">
                      {DTU_BRANCHES.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentCompany">Current Company</Label>
                  <Input
                    id="currentCompany"
                    value={formData.currentCompany}
                    onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                    placeholder="Google, Microsoft, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currentRole">Current Role</Label>
                  <Input
                    id="currentRole"
                    value={formData.currentRole}
                    onChange={(e) => handleInputChange('currentRole', e.target.value)}
                    placeholder="Software Engineer, Product Manager, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={!hasUserModified || updateProfileMutation.isPending || !formData.name || !formData.username || !formData.graduationYear}
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Complete Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 