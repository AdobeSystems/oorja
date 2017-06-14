// need to fix linting in this file. (support dynamic import)



export default {
  1: {
    tabId: 1,
    // must be without spaces (used to contain css, check out css for any of the tabs)
    name: 'Info',
    displayName: 'Room Information',
    // icons are currently from ionic, maybe allow images or svgs later
    // iconColor is for the tabSwitch when I was experimenting with them,
    // but later on I stuck with a set color scheme instead of a custom one for each tab.
    icon: 'android-share-alt',
    // bgColor is the background color for the tab content
    bgColor: '#ffffff',
    description: 'Invite others to this room',


    // by default if someone adds a tab in the room. it will be loaded for all
    // participants of the room. however if local is true then adding it won't load
    // it for others. e.g used in Reacteroids(game) tab.
    local: false,


    // specify custom streamContainer size for this tab
    // '' means auto (if there is any video stream [MEDIUM] else [COMPACT]),
    //  else specify one of [COMPACT, MEDIUM]. CSS for LARGE is not working well atm.
    streamContainerSize: '',

    // Cannot make the import path dynamic (i.e use a variable for import path) as it
    // needs to be statically analyzable. So it has to be this way for now.
    load: (callback) => {
      import('./tabs/Info').then(callback);
    },
  },
  10: {
    tabId: 10,
    name: 'VideoChat',
    displayName: 'Video chat',
    bgColor: '#25272a',
    icon: 'videocamera',
    description: 'Video chat',
    streamContainerSize: '',
    load: (callback) => {
      import('./tabs/VideoChat').then(callback);
    },
  },
  // {
  //   tabId: 30,
  //   name: 'Settings',
  //   displayName: 'Settings',
  //   iconColor: '#acf0f2',
  //   ContentBgColor: '',
  //   bgColor: '',
  //   icon: 'ios-settings',
  //   description: 'Configure your webcam and Room settings',
  //   streamContainerSize: '',
  // },
  40: {
    tabId: 40,
    name: 'QuillPad',
    displayName: 'QuillPad',
    bgColor: '#ffffff',
    icon: 'document-text',
    description: 'Shared Richtext document',
    streamContainerSize: '',
    load: (callback) => {
      import('./tabs/QuillPad').then(callback);
    },
  },
  41: {
    tabId: 41,
    name: 'CodePad',
    displayName: 'CodePad',
    bgColor: '',
    icon: 'code-working',
    description: 'Shared Code editor',
    streamContainerSize: '',
    load: (callback) => {
      import('./tabs/CodePad').then(callback);
    },
  },
  31: {
    tabId: 31,
    name: 'Chat',
    displayName: 'Chat',
    bgColor: '#faebd7',
    icon: 'chatbubbles',
    description: 'Chat messaging',
    streamContainerSize: '',
    load: (callback) => {
      import('./tabs/Chat').then(callback);
    },
  },
  100: {
    tabId: 100,
    name: 'DiscoverTabs',
    displayName: 'Discover Tabs',
    bgColor: '#ffffff',
    icon: 'ios-plus',
    description: 'Discover more tabs',
    streamContainerSize: 'COMPACT',
    load: (callback) => {
      import('./tabs/DiscoverTabs').then(callback);
    },
  },
  35: {
    tabId: 35,
    name: 'Reacteroids',
    displayName: 'Reacteroids',
    bgColor: '#ffffff',
    icon: 'planet',
    description: 'Play a game while you wait',
    streamContainerSize: 'COMPACT',
    local: true,
    load: (callback) => {
      import('./tabs/Reacteroids').then(callback);
    },
  },
  999: {
    tabId: 999,
    name: 'BlankSlate',
    displayName: 'Blank Slate',
    bgColor: '#ffffff',
    icon: 'lightbulb',
    description: 'For developers: A blank slate tab to be used as boilerplate for developing new tabs',
    streamContainerSize: 'COMPACT',
    local: true,
    load: (callback) => {
      import('./tabs/BlankSlate').then(callback);
    },
  },
  // add your tab description in a similar fashion
  // here as well as in app/imports/startup/server/api/tabRegistry.js

  // I could have made them refer to the same file however for dynamic imports to work
  // this will work.
  // Not using symlink as well since it is os dependent. 
};
