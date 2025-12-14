# Admin Tier Management Guide

## ✅ Functionality Already Exists!

Admin can change any user's tier and it saves to Firebase automatically.

## How to Change User Tiers

### Step 1: Access User Management
Navigate to: `/admin/users`

### Step 2: Find the User
- **Users Tab**: Regular users
- **Admins Tab**: Admin users

### Step 3: Edit User
Click the **Edit** button (pencil icon) on any user row

### Step 4: Select New Tier
In the dialog, choose from the dropdown:
- **Free** - Limited features (5 scans/day, basic AI)
- **Plus** - Enhanced features (20 scans/day, global search, 10 AI chats/day)
- **Pro** - Full features (unlimited scans, meal planner, PC builder, visual search)
- **Ultimate** - All Pro + white label, beta access, unlimited compare

### Step 5: Save
Click **"Save Changes"** button

## What Happens When You Change a Tier

1. **Immediate Firebase Update**: Tier is saved to `users/{userId}/subscription/tier`
2. **Timestamp Added**: `updatedAt` field is automatically updated
3. **Features Update**: User immediately gets access to new tier features
4. **Real-time Effect**: Next time user refreshes or navigates, new features appear

## Backend Details

**API Endpoint**: `/api/admin/action`
**Action**: `updateTier`
**Firebase Path**: `users/{userId}/subscription`

```typescript
// Backend saves as:
{
  subscription: {
    tier: 'pro',  // or free, plus, ultimate
    updatedAt: new Date()
  }
}
```

## Feature Access by Tier

| Feature | Free | Plus | Pro | Ultimate |
|---------|:----:|:----:|:---:|:--------:|
| Daily Scans | 5 | 20 | ∞ | ∞ |
| History | 10 | 50 | ∞ | ∞ |
| AI Chat | ❌ | 10/day | ∞ | ∞ |
| Global Search | ❌ | ✅ | ✅ | ✅ |
| Visual Search | ❌ | ❌ | ✅ | ✅ |
| Meal Planner | ❌ | ❌ | ✅ | ✅ |
| PC Builder | ❌ | ❌ | ✅ | ✅ |
| Product Compare | 0 | 2 | 5 | ∞ |
| Beta Access | ❌ | ❌ | ❌ | ✅ |

## Notes

- **Admin Role**: Admins automatically get Ultimate-level features regardless of tier
- **Instant Effect**: Changes take effect immediately upon save
- **Safe Operation**: Uses Firebase `merge: true` to prevent data loss
- **Audit Trail**: `updatedAt` timestamp tracks when tier was last changed
