import { NativeModules } from 'react-native'
const { RNBranch } = NativeModules

/**
 * Class for generating standard and custom events with the Branch SDK.
 * @example
 * new BranchEvent(BranchEvent.ViewEvent, buo).logEvent()
 */
export default class BranchEvent {
  /**
   * The event name. May be a standard event name or a custom event name.
   * @type {string}
   */
  name = null

  /**
   * Array containing any Branch Universal Objects associated with this event.
   * @type {Object[]}
   */
  contentItems = []

  /**
   * Transaction ID associated with this event
   * @type {?string}
   */
  transactionID = null

  /**
   * ISO currency identifier associated with this event
   * @type {?string}
   */
  currency = null

  /**
   * Revenue associated with this event
   * @type {?(string|number)}
   */
  revenue = null

  /**
   * Shipping cost associated with this event
   * @type {?(string|number)}
   */
  shipping = null

  /**
   * Tax associated with this event
   * @type {?(string|number)}
   */
  tax = null

  /**
   * Coupon associated with this event
   * @type {?string}
   */
  coupon = null

  /**
   * Affiliation associated with this event
   * @type {?string}
   */
  affiliation = null

  /**
   * Description of this event
   * @type {?string}
   */
  description = null

  /**
   * Search query associated with this event
   * @type {?string}
   */
  searchQuery = null

  /**
   * Optional object containing custom data to associate with this event.
   * Values must be strings.
   * @type {?Object}
   */
  customData = null

  /**
   * Optional alias for this event
   * @type {?string}
   */
  alias = null

  /**
   * Constructs a new BranchEvent from arguments
   *
   * @param {!string} name - The name of the event. May be a standard Branch event
   *   or a custom event name.
   * @param {?(Object|Object[])} contentItems - One or more Branch Universal Objects associated with this event, or null.
   * @param {?Object} params - Object containing params to be set in the constructor
   * @param {?string} params.transactionID - Initial value for the transactionID property
   * @param {?string} params.currency - Initial value for the currency property
   * @param {?(string|number)} params.revenue - Initial value for the revenue property
   * @param {?(string|number)} params.shipping - Initial value for the shipping property
   * @param {?(string|number)} params.tax - Initial value for the tax property
   * @param {?string} params.coupon - Initial value for the coupon property
   * @param {?string} params.affiliation - Initial value for the affiliation property
   * @param {?string} params.description - Initial value for the description property
   * @param {?string} params.searchQuery - Initial value for the searchQuery property
   * @param {?Object} params.customData - Initial value for the customData property
   */
  constructor(name, contentItems = null, params = {}) {
    this.name = name

    if (Array.isArray(contentItems)) {
      this.contentItems = contentItems
    }
    else if (contentItems) {
      this.contentItems = [contentItems]
    }

    if (params.transactionID) this.transactionID = params.transactionID
    if (params.currency) this.currency = params.currency
    if (params.revenue) this.revenue = params.revenue
    if (params.shipping) this.shipping = params.shipping
    if (params.tax) this.tax = params.tax
    if (params.coupon) this.coupon = params.coupon
    if (params.affiliation) this.affiliation = params.affiliation
    if (params.description) this.description = params.description
    if (params.searchQuery) this.searchQuery = params.searchQuery
    if (params.customData) this.customData = params.customData
    if (params.alias) this.alias = params.alias
  }

  /**
   * Log this event. This method is always successful. It queues events to be
   * transmitted whenever the service is available. It returns a promise that
   * is resolved once the native logEvent call is complete. The promise always
   * returns null.
   *
   * @return {null} Always returns null
   */
  async logEvent() {
    const idents = this.contentItems.map((b) => b.ident)

    try {
      return await RNBranch  ?  RNBranch.logEvent(idents, this.name, this._convertParams()) : null
    }
    catch (error) {
      if (error.code != 'RNBranch::Error::BUONotFound') {
        // This is the only reason this promise should ever be rejected,
        // but in case anything else is ever thrown, throw it out to the
        // caller.
        throw error
      }

      // Native BUO not found (expired from cache). Find the JS instance and
      // have it create a new native instance with a new ident.
      const ident = this._identFromMessage(error.message)
      const buo = this.contentItems.find((b) => b.ident == ident)
      await buo._newIdent()

      // Now that a fresh BUO has been created, call this method again.
      return await this.logEvent()
    }
  }

  // Parse the ident of the missing BUO out of the error text.
  _identFromMessage(message) {
    const match = /^.*ident\s([A-Fa-f0-9-]+).*$/.exec(message)
    if (match) return match[1]
    return null
  }

  _convertParams() {
    let params = {}

    if (this.transactionID) params.transactionID = this.transactionID
    if (this.currency) params.currency = this.currency

    // for the benefit of the NSDecimalNumber on iOS
    if (this.revenue) params.revenue = '' + this.revenue
    if (this.shipping) params.shipping = '' + this.shipping
    if (this.tax) params.tax = '' + this.tax

    if (this.coupon) params.coupon = this.coupon
    if (this.affiliation) params.affiliation = this.affiliation
    if (this.description) params.description = this.description
    if (this.searchQuery) params.searchQuery = this.searchQuery
    if (this.customData) {
      params.customData = this.customData
      for (const key in params.customData) {
        const valueType = typeof params.customData[key]
        if (valueType == 'string') continue
        console.warn('[Branch] customMetadata values must be strings. Value for property ' + key + ' has type ' + valueType + '.')
        // TODO: throw?
      }
    }
    if (this.alias) params.alias = this.alias

    return params
  }
}

// --- Standard event definitions ---

// Commerce events

/**
 * Standard Add to Cart event
 * @type {string}
 */
BranchEvent.AddToCart = RNBranch && RNBranch.STANDARD_EVENT_ADD_TO_CART ? RNBranch.STANDARD_EVENT_ADD_TO_CART : null


/**
 * Standard Add to Wishlist event
 * @type {string}
 */
BranchEvent.AddToWishlist = RNBranch && RNBranch.STANDARD_EVENT_ADD_TO_WISHLIST ? RNBranch.STANDARD_EVENT_ADD_TO_WISHLIST : null

/**
 * Standard View Cart event
 * @type {string}
 */
BranchEvent.ViewCart =  RNBranch && RNBranch.STANDARD_EVENT_VIEW_CART ? RNBranch.STANDARD_EVENT_VIEW_CART : null

/**
 * Standard Initiate Purchase event
 * @type {string}
 */
BranchEvent.InitiatePurchase = RNBranch && RNBranch.STANDARD_EVENT_INITIATE_PURCHASE ? RNBranch.STANDARD_EVENT_INITIATE_PURCHASE : null

/**
 * Standard Add Payment Info event
 * @type {string}
 */
BranchEvent.AddPaymentInfo = RNBranch && RNBranch.STANDARD_EVENT_ADD_PAYMENT_INFO ? RNBranch.STANDARD_EVENT_ADD_PAYMENT_INFO : null

/**
 * Standard Purchase event
 * @type {string}
 */
BranchEvent.Purchase = RNBranch &&  RNBranch.STANDARD_EVENT_PURCHASE ? RNBranch.STANDARD_EVENT_PURCHASE : null

/**
 * Standard Spend Credits event
 * @type {string}
 */
BranchEvent.SpendCredits =  RNBranch && RNBranch.STANDARD_EVENT_SPEND_CREDITS ? RNBranch.STANDARD_EVENT_SPEND_CREDITS : null

/**
 * Standard View Ad event
 * @type {string}
 */
BranchEvent.ViewAd = RNBranch && RNBranch.STANDARD_EVENT_VIEW_AD ? RNBranch.STANDARD_EVENT_VIEW_AD : null

/**
 * Standard Click Ad event
 * @type {string}
 */
BranchEvent.ClickAd = RNBranch && RNBranch.STANDARD_EVENT_CLICK_AD ? RNBranch.STANDARD_EVENT_CLICK_AD : null

// Content events

/**
 * Standard Search event
 * @type {string}
 */
BranchEvent.Search = RNBranch &&  RNBranch.STANDARD_EVENT_SEARCH ? RNBranch.STANDARD_EVENT_SEARCH : null

/**
 * Standard View Item event for a single Branch Universal Object
 * @type {string}
 */
BranchEvent.ViewItem = RNBranch && RNBranch.STANDARD_EVENT_VIEW_ITEM ?  RNBranch.STANDARD_EVENT_VIEW_ITEM : null

/**
 * Standard View Items event for multiple Branch Universal Objects
 * @type {string}
 */
BranchEvent.ViewItems = RNBranch &&  RNBranch.STANDARD_EVENT_VIEW_ITEMS ?  RNBranch.STANDARD_EVENT_VIEW_ITEMS : null

/**
 * Standard Rate event
 * @type {string}
 */
BranchEvent.Rate = RNBranch && RNBranch.STANDARD_EVENT_RATE ?  RNBranch.STANDARD_EVENT_RATE : null

/**
 * Standard Share event
 * @type {string}
 */
BranchEvent.Share = RNBranch && RNBranch.STANDARD_EVENT_SHARE ? RNBranch.STANDARD_EVENT_SHARE : null

// User Lifecycle Events

/**
 * Standard Complete Registration event
 * @type {string}
 */
BranchEvent.CompleteRegistration = RNBranch &&  RNBranch.STANDARD_EVENT_COMPLETE_REGISTRATION ? RNBranch.STANDARD_EVENT_COMPLETE_REGISTRATION : null

/**
 * Standard Complete Tutorial event
 * @type {string}
 */
BranchEvent.CompleteTutorial = RNBranch && RNBranch.STANDARD_EVENT_COMPLETE_TUTORIAL ? RNBranch.STANDARD_EVENT_COMPLETE_TUTORIAL : null

/**
 * Standard Achieve Level event
 * @type {string}
 */
BranchEvent.AchieveLevel = RNBranch && RNBranch.STANDARD_EVENT_ACHIEVE_LEVEL ? RNBranch.STANDARD_EVENT_ACHIEVE_LEVEL : null

/**
 * Standard Unlock Achievement event
 * @type {string}
 */
BranchEvent.UnlockAchievement = RNBranch && RNBranch.STANDARD_EVENT_UNLOCK_ACHIEVEMENT ? RNBranch.STANDARD_EVENT_UNLOCK_ACHIEVEMENT : null

/**
 * Standard Invite event
 * @type {string}
 */
BranchEvent.Invite = RNBranch && RNBranch.STANDARD_EVENT_INVITE ? RNBranch.STANDARD_EVENT_INVITE : null

/**
 * Standard Login event
 * @type {string}
 */
BranchEvent.Login = RNBranch && RNBranch.STANDARD_EVENT_LOGIN ? RNBranch.STANDARD_EVENT_LOGIN : null

/**
 * Standard Reserve event
 * @type {string}
 */
BranchEvent.Reserve = RNBranch && RNBranch.STANDARD_EVENT_RESERVE ? RNBranch.STANDARD_EVENT_RESERVE : null

/**
 * Standard Subscribe event
 * @type {string}
 */
BranchEvent.Subscribe = RNBranch &&  RNBranch.STANDARD_EVENT_SUBSCRIBE ? RNBranch.STANDARD_EVENT_SUBSCRIBE : null

/**
 * Standard Start Trial event
 * @type {string}
 */
BranchEvent.StartTrial = RNBranch && RNBranch.STANDARD_EVENT_START_TRIAL ?  RNBranch.STANDARD_EVENT_START_TRIAL : null
