#import <UIKit/UIKit.h>
#if __has_include(<React/RCTAppDelegate.h>)
  #import <React/RCTAppDelegate.h>
#elif __has_include(<React_Core/RCTAppDelegate.h>)
  #import <React_Core/RCTAppDelegate.h>
#else
  #import "RCTAppDelegate.h"
#endif

@interface AppDelegate : RCTAppDelegate
@end
