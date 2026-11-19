import { ApiError, NetworkError } from './client'

const MESSAGES: Record<string, string> = {
  ACCOUNT_SETUP_INCOMPLETE: 'Your sign-up is not finished. We have emailed you a new code to verify your email.',
  INVALID_CURRENT_PASSWORD: 'Your current password is incorrect.',
  PASSWORD_UNCHANGED: 'Your new password must be different from your current one.',
  NAME_LOCKED: 'Your name is locked because your identity is verified.',
  INVALID_PHONE: 'Enter a valid phone number for your country.',
  WALLET_NAME_TAKEN: 'You already have a wallet with this name.',
  INVALID_CATEGORY: 'Choose a category from the list.',
  WALLET_NOT_EMPTY: 'This wallet still holds money. Move it to your salary account before deleting.',
  INSUFFICIENT_BALANCE: 'The amount is more than this wallet holds.',
  BANK_LOOKUP_UNAVAILABLE: 'Bank lookup is unavailable right now. Please try again shortly.',
  ACCOUNT_NOT_FOUND: 'We could not find an account with that number at this bank.',
  UNKNOWN_BANK: 'Choose a bank from the list.',
  BENEFICIARY_EXISTS: 'You have already saved this account as a beneficiary.',
  DESTINATION_HAS_RULE: 'This destination already has a split rule. Edit that rule instead.',
  ALLOCATION_EXCEEDS_SALARY: 'This rule would allocate more than your monthly salary.',
  DESTINATION_NOT_FOUND: 'That wallet or beneficiary no longer exists.',
  INVALID_RULE_VALUE: 'Enter a valid amount or percentage.',
  SALARY_ACCOUNT_NOT_ACTIVE: 'Your salary account is not active yet.',
  NO_ACTIVE_RULES: 'You have no active split rules to run.',
  NOTHING_TO_SPLIT: 'There is no unallocated money in your salary account to split.',
  SPLIT_RUN_NOT_FOUND: 'We could not find that split.',
  SALARY_ACCOUNT_IDENTITY_NOT_NEEDED: 'Your salary account does not need another ID.',
  ID_ALREADY_USED: 'This ID is already linked to another PaySplit account.',
  IDENTITY_NOT_FOUND: 'We could not find a record for that number. Check it and try again.',
  NAME_MISMATCH: 'The name on this record does not match your PaySplit name.',
  DOB_MISMATCH: 'The date of birth on this record does not match.',
  ATTEMPTS_EXCEEDED: 'You have reached the daily limit for attempts. Please try again tomorrow.',
  PROVIDER_UNAVAILABLE: 'Our verification partner is unavailable right now. Please try again shortly.',
  KYC_REQUIRED: 'Complete identity verification to do this.',
}

export function errorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'We could not reach PaySplit. Check your connection and try again.'
  }
  if (error instanceof ApiError) {
    if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!
    if (error.status === 429) return 'Too many attempts. Please wait a moment and try again.'
    if (error.status >= 500) return 'Something went wrong on our side. Please try again.'
    return error.details.length > 1 ? error.details.join('. ') : error.message
  }
  return 'Something unexpected happened. Please try again.'
}

export function isRetryable(error: unknown): boolean {
  return error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)
}
