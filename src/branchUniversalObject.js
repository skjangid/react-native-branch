import { NativeModules, Platform } from 'react-native'
import BranchEvent from './BranchEvent'

const { RNBranch } = NativeModules

export default async function createBranchUniversalObject(identifier, options = {}) {
  if (typeof identifier !== 'string') throw new Error('react-native-branch: identifier must be a string')

  const contentMetadata = options.contentMetadata || {}

  if (contentMetadata.customMetadata) {
    for (const key in contentMetadata.customMetadata) {
      const valueType = typeof contentMetadata.customMetadata[key]
      if (valueType == 'string') continue
      console.warn('[Branch] customMetadata values must be strings. Value for property ' + key + ' has type ' + valueType + '.')
      // TODO: throw?
    }
  }

  const branchUniversalObject = {
    canonicalIdentifier: identifier,
    contentMetadata: contentMetadata,
    ...options
  }

  // For the benefit of NSDecimalNumber on iOS.
  const price = contentMetadata.price === undefined ? undefined : '' + contentMetadata.price
  branchUniversalObject.contentMetadata.price = price

  if (options.automaticallyListOnSpotlight !== undefined) {
    console.info('[Branch] automaticallyListOnSpotlight is deprecated. Please use locallyIndex instead.')
  }

  if (options.price !== undefined) {
    console.info('[Branch] price is deprecated. Please use contentMetadata.price instead.')
  }

  if (options.currency !== undefined) {
    console.info('[Branch] currency is deprecated. Please use contentMetadata.price instead.')
  }

  if (options.metadata !== undefined) {
    console.info('[Branch] metadata is deprecated. Please use contentMetadata.customMetadata instead.')
  }

  if (options.contentIndexingMode !== undefined) {
    console.info('[Branch] contentIndexingMode is deprecated. Please use locallyIndex or publiclyIndex instead.')
  }

  const { ident } = RNBranch ? await RNBranch.createUniversalObject(branchUniversalObject) : null

  return {
    ident: ident,
    showShareSheet(shareOptions = {}, linkProperties = {}, controlParams = {}) {
      shareOptions = {
        title: options.title || '',
        text: options.contentDescription || '',
        ...shareOptions,
      }

      linkProperties = {
        feature: 'share',
        channel: 'RNApp',
        ...linkProperties,
      }

      return this._tryFunction(RNBranch && RNBranch.showShareSheet ? RNBranch.showShareSheet : null, shareOptions, linkProperties, controlParams)
    },
    // deprecated in favor of userCompletedAction(RegisterViewEvent)
    registerView() {
      console.info('[Branch] registerView is deprecated. Please use logEvent(BranchEvent.ViewItem) instead.')
      return this._tryFunction(RNBranch && RNBranch.registerView ? RNBranch.registerView : null)
    },
    generateShortUrl(linkProperties = {}, controlParams = {}) {
      return this._tryFunction(RNBranch && RNBranch.generateShortUrl ? RNBranch.generateShortUrl : null, linkProperties, controlParams)
    },
    listOnSpotlight() {
      console.info('[Branch] listOnSpotlight is deprecated. Please use locallyIndex instead.')
      if (Platform.OS !== 'ios') return Promise.resolve()
      return this._tryFunction(RNBranch &&  RNBranch.listOnSpotlight ? RNBranch.listOnSpotlight : null)
    },
    userCompletedAction(event, state = {}) {
      console.info('[Branch] userCompletedAction is deprecated. Please use logEvent or the BranchEvent class instead.')
      const dataValue = RNBranch && RNBranch.REGISTER_VIEW_EVENT ? RNBranch.REGISTER_VIEW_EVENT : null
      if (event == dataValue) {
        return this.logEvent(BranchEvent.ViewItem, { customData: state })
      }
      return this._tryFunction(RNBranch && RNBranch.userCompletedActionOnUniversalObject ? RNBranch.userCompletedActionOnUniversalObject : null, event, state)
    },
    logEvent(eventName, params = {}) {
      return new BranchEvent(eventName, this, params).logEvent()
    },
    release() {
      return RNBranch ? RNBranch.releaseUniversalObject(this.ident) : null
    },

    /**
     * Used by exception handlers when RNBranch::Error::BUONotFound is caught.
     */
    _newIdent() {
      if(RNBranch) {
      return RNBranch.createUniversalObject(branchUniversalObject).then(({ident}) => {
        this.ident = ident
        return ident
      })
    } else {
      return null;
    }
    },

    _tryFunction(func, ...args) {
      return func(this.ident, ...args).catch((error) => {
        if (error.code != 'RNBranch::Error::BUONotFound') {
          throw error
        }
        return this._newIdent().then((ident) => {
          return func(ident, ...args)
        })
      })
    }
  }
}
