local rarities = {
  [0] = "Iron",
  [1] = "Bronze",
  [2] = "Silver",
  [3] = "Gold",
  [4] = "Platinum",
  [5] = "Black",
  [7] = "Sapphire",
}

local function get_name(id)
  rarity = rarities[id]
  if rarity then
    return rarity
  else
    return "Rarity " .. id
  end
end

return {
  get_name = get_name,
}
