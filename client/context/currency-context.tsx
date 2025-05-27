"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define exchange rates
export const exchangeRates = {
  USD: 1,
  VND: 25000,
  EUR: 0.9,
  GBP: 0.78,
  CAD: 1.35,
  AUD: 1.48,
  JPY: 150.2,
  INR: 83.5,
  BRL: 5.05,
  MXN: 16.8,
  SGD: 1.33,
}

// Map currencies to locales for formatting
export const currencyLocales = {
  USD: "en-US",
  VND: "vi-VN",
  EUR: "de-DE",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
  JPY: "ja-JP",
  INR: "hi-IN",
  BRL: "pt-BR",
  MXN: "es-MX",
  SGD: "zh-SG",
}

// Define the shape of our context
type CurrencyContextType = {
  currency: string
  setCurrency: (currency: string) => void
  convertPrice: (priceUSD: number) => number
  formatPrice: (price: number) => string
  formatPriceWithSymbol: (price: number) => string
  getCurrencySymbol: (currencyCode?: string) => string
}

// Create the context with default values
const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  convertPrice: (price) => price,
  formatPrice: (price) => `$${price}`,
  formatPriceWithSymbol: (price) => `$${price}`,
  getCurrencySymbol: () => "$",
})

// Custom hook to use the currency context
export const useCurrency = () => useContext(CurrencyContext)

// Currency symbols mapping
export const currencySymbols = {
  USD: "$",
  VND: "₫",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
  INR: "₹",
  BRL: "R$",
  MXN: "MX$",
  SGD: "S$",
}

// Provider component
export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Initialize with USD or the stored preference
  const [currency, setCurrency] = useState<string>("USD")
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load saved currency preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("preferredCurrency")
      if (savedCurrency && Object.keys(exchangeRates).includes(savedCurrency)) {
        setCurrency(savedCurrency)
      }
    }
  }, [isClient])

  // Save currency preference when it changes
  const updateCurrency = (newCurrency: string) => {
    setCurrency(newCurrency)
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredCurrency", newCurrency)
    }
  }

  // Convert a USD price to the selected currency
  const convertPrice = (priceUSD: number): number => {
    const rate = exchangeRates[currency as keyof typeof exchangeRates] || 1
    return priceUSD * rate
  }

  // Format a price in the selected currency
  const formatPrice = (price: number): string => {
    if (!isClient) return `$${price.toFixed(2)}`

    const locale = currencyLocales[currency as keyof typeof currencyLocales] || "en-US"
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    }).format(price)
  }

  // Format price with just the symbol and number (no currency code)
  const formatPriceWithSymbol = (price: number): string => {
    if (!isClient) return `$${price.toFixed(2)}`

    const symbol = getCurrencySymbol()
    const locale = currencyLocales[currency as keyof typeof currencyLocales] || "en-US"

    return `${symbol}${new Intl.NumberFormat(locale, {
      style: "decimal",
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    }).format(price)}`
  }

  // Get currency symbol
  const getCurrencySymbol = (currencyCode?: string): string => {
    const code = currencyCode || currency
    return currencySymbols[code as keyof typeof currencySymbols] || "$"
  }

  // Provide the context values
  const value = {
    currency,
    setCurrency: updateCurrency,
    convertPrice,
    formatPrice,
    formatPriceWithSymbol,
    getCurrencySymbol,
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}
