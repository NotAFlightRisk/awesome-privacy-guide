// Upstream writes most product names in lowercase, these put the capitals back
const words = {
  icloud: 'iCloud', ios: 'iOS', macos: 'macOS', imovie: 'iMovie', iterm2: 'iTerm2', iwork: 'iWork',
  whatsapp: 'WhatsApp', youtube: 'YouTube', linkedin: 'LinkedIn', tiktok: 'TikTok', wechat: 'WeChat',
  github: 'GitHub', gitlab: 'GitLab', sourceforge: 'SourceForge', godaddy: 'GoDaddy',
  hostgator: 'HostGator', ringcentral: 'RingCentral', hubspot: 'HubSpot', gotomeeting: 'GoToMeeting',
  onedrive: 'OneDrive', onenote: 'OneNote', expressvpn: 'ExpressVPN', nordvpn: 'NordVPN',
  ipvanish: 'IPVanish', cyberghost: 'CyberGhost', opendns: 'OpenDNS', smartthings: 'SmartThings',
  sharex: 'ShareX', irfanview: 'IrfanView', kmplayer: 'KMPlayer', mplayer: 'MPlayer',
  davinci: 'DaVinci', garageband: 'GarageBand', handbrake: 'HandBrake', intellij: 'IntelliJ',
  idea: 'IDEA', pycharm: 'PyCharm', powershell: 'PowerShell', putty: 'PuTTY', utorrent: 'uTorrent',
  bittorrent: 'BitTorrent', habitbull: 'HabitBull', ticktick: 'TickTick', wetransfer: 'WeTransfer',
  wisestamp: 'WiseStamp', xsplit: 'XSplit', obs: 'OBS', cc: 'CC', '4d': '4D', aws: 'AWS',
  codecommit: 'CodeCommit', aol: 'AOL', dns: 'DNS', em: 'eM', '(ynab)': '(YNAB)',
  'paint.net': 'Paint.NET', 'justpaste.it': 'JustPaste.it', suse: 'SUSE', centos: 'CentOS',
  mcafee: 'McAfee', ublock: 'uBlock', adblock: 'AdBlock', fl: 'FL', sketchup: 'SketchUp',
  pencil2d: 'Pencil2D', gnome: 'GNOME', connectsafe: 'ConnectSafe', libreoffice: 'LibreOffice',
  quicktime: 'QuickTime', wordpress: 'WordPress', paintshop: 'PaintShop',
  pocketguard: 'PocketGuard', line: 'LINE',
};
const small = new Set(['of', 'for', 'and', 'the']);

/** "facebook messenger" -> "Facebook Messenger", leaving names written properly alone */
export const brandCase = (name) =>
  name !== name.toLowerCase()
    ? name
    : name
        .split(' ')
        .map((word, i) =>
          words[word] ?? (i && small.has(word) ? word : word[0].toUpperCase() + word.slice(1)),
        )
        .join(' ');
