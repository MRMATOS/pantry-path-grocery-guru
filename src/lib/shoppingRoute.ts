import { Product } from './supabase';

// Function to determine if an aisle is on the right or left side
function isRightSide(aisle: number): boolean {
  return aisle >= 25 && aisle <= 52;
}

// Function to get the equivalent aisle on the opposite side
function getOppositeAisle(aisle: number): number {
  if (aisle >= 25 && aisle <= 52) {
    // For right side aisles (25-52), the opposite is on the left side (81-54)
    return 106 - aisle; // This formula gives 81 for 25, 80 for 26, etc.
  } else if (aisle >= 53 && aisle <= 81) {
    // For left side aisles (53-81), the opposite is on the right side (25-53)
    return 106 - aisle; // This formula gives 53 for 53, 52 for 54, etc.
  }
  return aisle; // For aisles outside the Block B range, return as is
}

// Function to optimize the shopping route based on physical proximity
export function optimizeShoppingRoute(products: Product[]): Product[] {
  if (!products.length) return [];
  
  // Sort products by aisle, but considering physical layout rather than numerical order
  return [...products].sort((a, b) => {
    const aisleA = a.corredor || 0;
    const aisleB = b.corredor || 0;
    
    // Special handling for Block B (aisles 25-81)
    if ((aisleA >= 25 && aisleA <= 81) && (aisleB >= 25 && aisleB <= 81)) {
      // If both aisles are on the same side (both on right or both on left)
      const aSideRight = isRightSide(aisleA);
      const bSideRight = isRightSide(aisleB);
      
      if (aSideRight === bSideRight) {
        // If both on right side (25-52), sort in ascending order
        if (aSideRight) {
          return aisleA - aisleB;
        } 
        // If both on left side (53-81), sort in descending order
        return aisleB - aisleA;
      }
      
      // If they're on different sides, check if they're across from each other
      const aOpposite = getOppositeAisle(aisleA);
      if (aOpposite === aisleB) {
        // If they're directly opposite, keep them together
        // Prefer the right side first (lower aisle number)
        return aSideRight ? -1 : 1;
      }
      
      // Otherwise, prefer right side first, then sort by physical position
      if (aSideRight) return -1;
      if (bSideRight) return 1;
    }
    
    // Default case: sort by aisle number
    return aisleA - aisleB;
  });
}
