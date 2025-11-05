// GachaSystem.js - Voucher pack opening and management system
import { db } from '../Config/api_services'
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  deleteDoc,
  Timestamp
} from 'firebase/firestore'

// Constants
const PACK_COST = 50 // bananas
const PITY_THRESHOLD = 10 // guaranteed epic after 10 packs

// Voucher pool with rarity tiers
const VOUCHER_POOL = {
  common: [
    { brand: "Shopee", amount: 3, icon: "🛍️", color: "#EE4D2D" },
    { brand: "GrabFood", amount: 5, icon: "🍔", color: "#00B14F" },
    { brand: "FairPrice", amount: 5, icon: "🛒", color: "#E31837" },
    { brand: "Starbucks", amount: 5, icon: "☕", color: "#00704A" },
    { brand: "Popular", amount: 5, icon: "📚", color: "#ED1C24" },
  ],
  rare: [
    { brand: "Shopee", amount: 10, icon: "🛍️", color: "#EE4D2D" },
    { brand: "Grab", amount: 10, icon: "🚗", color: "#00B14F" },
    { brand: "Netflix", amount: 10, icon: "🎬", color: "#E50914" },
    { brand: "GymBoxx", amount: 15, icon: "💪", color: "#FF6B35" },
    { brand: "Golden Village", amount: 12, icon: "🎥", color: "#FFD700" },
  ],
  epic: [
    { brand: "Shopee", amount: 25, icon: "🛍️", color: "#EE4D2D" },
    { brand: "Grab", amount: 25, icon: "🚗", color: "#00B14F" },
    { brand: "Netflix", amount: 30, icon: "🎬", color: "#E50914" },
    { brand: "Courts", amount: 30, icon: "🔌", color: "#ED1C24" },
    { brand: "Sephora", amount: 30, icon: "💄", color: "#000000" },
  ],
  legendary: [
    { brand: "Shopee", amount: 100, icon: "🛍️", color: "#EE4D2D" },
    { brand: "Grab", amount: 100, icon: "🚗", color: "#00B14F" },
    { brand: "Netflix", amount: 100, icon: "🎬", color: "#E50914" },
    { brand: "Takashimaya", amount: 100, icon: "🏬", color: "#8B4513" },
    { brand: "Apple", amount: 100, icon: "🍎", color: "#000000" },
  ]
}

// Probability distributions
const PAID_PACK_ODDS = {
  common: 0.70,    // 70%
  rare: 0.20,      // 20%
  epic: 0.08,      // 8%
  legendary: 0.02  // 2%
}

const FREE_PACK_ODDS = {
  common: 0.85,    // 85%
  rare: 0.12,      // 12%
  epic: 0.03,      // 3%
  legendary: 0.00  // 0% - no legendaries in free packs
}

// Helper: Get pity counter
export async function getPityCounter(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'TestMonkey', uid))
    if (!userDoc.exists()) {
      throw new Error('User not found')
    }
    return userDoc.data().pityCounter || 0
  } catch (error) {
    console.error('Error getting pity counter:', error)
    throw error
  }
}

// Helper: Increment pity counter
export async function incrementPityCounter(uid) {
  try {
    const userRef = doc(db, 'TestMonkey', uid)
    const userDoc = await getDoc(userRef)
    const currentPity = userDoc.data().pityCounter || 0

    await updateDoc(userRef, {
      pityCounter: currentPity + 1
    })

    return currentPity + 1
  } catch (error) {
    console.error('Error incrementing pity counter:', error)
    throw error
  }
}

// Helper: Reset pity counter
export async function resetPityCounter(uid) {
  try {
    await updateDoc(doc(db, 'TestMonkey', uid), {
      pityCounter: 0
    })
  } catch (error) {
    console.error('Error resetting pity counter:', error)
    throw error
  }
}

// Helper: Check if user can claim free pack
export async function canClaimFreePack(uid) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const q = query(
      collection(db, 'DailySpins'),
      where('userId', '==', uid),
      where('claimedAt', '>=', Timestamp.fromDate(today))
    )

    const snapshot = await getDocs(q)
    return snapshot.empty // true if can claim, false if already claimed today
  } catch (error) {
    console.error('Error checking free pack eligibility:', error)
    throw error
  }
}

// Helper: Update free pack claim
export async function updateFreePackClaim(uid) {
  try {
    await addDoc(collection(db, 'DailySpins'), {
      userId: uid,
      claimedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating free pack claim:', error)
    throw error
  }
}

// Helper: Generate voucher code
function generateVoucherCode(brand) {
  const prefix = brand.substring(0, 3).toUpperCase()
  const random = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `${prefix}-${random}`
}

// Helper: Determine rarity based on odds and pity
function determineRarity(odds, pityCounter) {
  // Check pity system first
  if (pityCounter >= PITY_THRESHOLD) {
    return 'epic' // Guaranteed epic at pity threshold
  }

  const roll = Math.random()
  let cumulative = 0

  // Check legendary
  cumulative += odds.legendary
  if (roll < cumulative) return 'legendary'

  // Check epic
  cumulative += odds.epic
  if (roll < cumulative) return 'epic'

  // Check rare
  cumulative += odds.rare
  if (roll < cumulative) return 'rare'

  // Common
  return 'common'
}

// Helper: Select random voucher from rarity tier
function selectVoucher(rarity) {
  const pool = VOUCHER_POOL[rarity]
  const randomIndex = Math.floor(Math.random() * pool.length)
  return { ...pool[randomIndex], rarity }
}

// Add voucher to user account
async function addVoucher(voucher_id,uid){
  const userRef =  doc(db, 'TestMonkey',uid)
  const userDoc = await getDoc(userRef)

  var vouchers = userDoc.data().vouchers
  vouchers.push(voucher_id)

  await updateDoc(userRef, { 
            vouchers: vouchers,
          });
}

// Main: Open voucher pack
export async function openVoucherPack(uid, isFree = false) {
  try {
    // If free pack, check eligibility
    if (isFree) {
      const canClaim = await canClaimFreePack(uid)
      if (!canClaim) {
        throw new Error('You have already claimed your free pack today')
      }
    } else {
      // Paid pack - check and deduct bananas
      console.log('opening paid pack')
      const userDoc = await getDoc(doc(db, 'TestMonkey', uid))
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }
      console.log('get user info')

      const currentBalance = userDoc.data().bananaBalance || 0
      if (currentBalance < PACK_COST) {
        throw new Error(`Insufficient bananas. You need ${PACK_COST} bananas.`)
      }
       console.log('balance checked')

      // Deduct bananas
      await updateDoc(doc(db, 'TestMonkey', uid), {
        bananaBalance: currentBalance - PACK_COST
      })
      console.log('balance deducted')
    }

    // Get pity counter (only for paid packs)
    let pityCounter = 0
    if (!isFree) {
      pityCounter = await getPityCounter(uid)
      console.log('get pity')
    }

    // Determine rarity
    const odds = isFree ? FREE_PACK_ODDS : PAID_PACK_ODDS
    const rarity = determineRarity(odds, pityCounter)
    console.log('setting odds')

    // Update pity counter (only for paid packs)
    if (!isFree) {
      if (rarity === 'epic' || rarity === 'legendary') {
        await resetPityCounter(uid)
      } else {
        await incrementPityCounter(uid)
      }
      console.log('updated pity')
    }

    // Select voucher
    const voucher = selectVoucher(rarity)
    console.log('select voucher')

    // Generate voucher code and expiry
    const voucherCode = generateVoucherCode(voucher.brand)
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30) // 30 days from now
    console.log('generate voucher', uid)

    // Save voucher to Firestore
    const voucherRef = await addDoc(collection(db, 'Vouchers'), {
      userId: uid,
      brand: voucher.brand,
      amount: voucher.amount,
      rarity: voucher.rarity,
      icon: voucher.icon,
      color: voucher.color,
      code: voucherCode,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiryDate),
      redeemed: false,
      redeemedAt: null
    })
    await addVoucher(voucherRef.id,uid)
    console.log('Save Voucher')

    // Record pack opening
    await addDoc(collection(db, 'PackOpenings'), {
      userId: uid,
      userName: '', // Will be populated from user data in UI
      voucherBrand: voucher.brand,
      voucherAmount: voucher.amount,
      rarity: voucher.rarity,
      isFree: isFree,
      openedAt: Timestamp.now()
    })
    console.log('record pack opening')

    // Update free pack claim if applicable
    if (isFree) {
      await updateFreePackClaim(uid)
    }
    console.log('update free pack opening')
    // Return voucher details
    console.log('returning opening details')
    return {
      id: voucherRef.id,
      brand: voucher.brand,
      amount: voucher.amount,
      rarity: voucher.rarity,
      icon: voucher.icon,
      color: voucher.color,
      code: voucherCode,
      expiresAt: expiryDate,
      pityCounter: rarity === 'epic' || rarity === 'legendary' ? 0 : pityCounter + 1
    }
  } catch (error) {
    console.error('Error opening voucher pack:', error)
    throw error
  }
}

// Get user's voucher inventory
export async function getUserVouchers(uid) {
  try {
    const q = query(
      collection(db, 'Vouchers'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    const vouchers = []

    snapshot.forEach(doc => {
      const data = doc.data()
      vouchers.push({
        id: doc.id,
        brand: data.brand,
        amount: data.amount,
        rarity: data.rarity,
        icon: data.icon,
        color: data.color,
        code: data.code,
        createdAt: data.createdAt.toDate(),
        expiresAt: data.expiresAt.toDate(),
        redeemed: data.redeemed,
        redeemedAt: data.redeemedAt ? data.redeemedAt.toDate() : null
      })
    })

    return vouchers
  } catch (error) {
    console.error('Error getting user vouchers:', error)
    throw error
  }
}

// Redeem voucher
export async function redeemVoucher(voucherId, uid) {
  try {
    const voucherRef = doc(db, 'Vouchers', voucherId)
    const voucherDoc = await getDoc(voucherRef)

    if (!voucherDoc.exists()) {
      throw new Error('Voucher not found')
    }

    const voucherData = voucherDoc.data()

    // Verify ownership
    if (voucherData.userId !== uid) {
      throw new Error('You do not own this voucher')
    }

    // Check if already redeemed
    if (voucherData.redeemed) {
      throw new Error('This voucher has already been redeemed')
    }

    // Check if expired
    const now = new Date()
    const expiryDate = voucherData.expiresAt.toDate()
    if (now > expiryDate) {
      throw new Error('This voucher has expired')
    }

    // Mark as redeemed
    await updateDoc(voucherRef, {
      redeemed: true,
      redeemedAt: Timestamp.now()
    })

    return true
  } catch (error) {
    console.error('Error redeeming voucher:', error)
    throw error
  }
}

// Remove expired vouchers
export async function removeExpiredVouchers(uid) {
  try {
    const now = Timestamp.now()

    const q = query(
      collection(db, 'Vouchers'),
      where('userId', '==', uid),
      where('expiresAt', '<', now),
      where('redeemed', '==', false)
    )

    const snapshot = await getDocs(q)
    const deletePromises = []

    snapshot.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref))
    })

    await Promise.all(deletePromises)

    return deletePromises.length // Return number of vouchers removed
  } catch (error) {
    console.error('Error removing expired vouchers:', error)
    throw error
  }
}

// Get recent winners for feed
export async function getRecentWinners(limitCount = 20) {
  try {
    const q = query(
      collection(db, 'PackOpenings'),
      orderBy('openedAt', 'desc'),
      limit(limitCount)
    )

    const snapshot = await getDocs(q)
    const winners = []

    snapshot.forEach(doc => {
      const data = doc.data()
      winners.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName || 'Anonymous',
        voucherBrand: data.voucherBrand,
        voucherAmount: data.voucherAmount,
        rarity: data.rarity,
        isFree: data.isFree,
        openedAt: data.openedAt.toDate()
      })
    })

    return winners
  } catch (error) {
    console.error('Error getting recent winners:', error)
    throw error
  }
}

// Export constants for use in components
export const GACHA_CONSTANTS = {
  PACK_COST,
  PITY_THRESHOLD,
  VOUCHER_POOL,
  PAID_PACK_ODDS,
  FREE_PACK_ODDS
}
