class AudioManager {
  private sfxOn = (localStorage.getItem('bh.sfx') ?? 'on') === 'on'
  private bgmOn = (localStorage.getItem('bh.bgm') ?? 'off') === 'on'
  private started = false
  private bg?: HTMLAudioElement
  private cache = new Map<string, HTMLAudioElement>()

  private load(name: string, url: string) {
    if (!this.cache.has(name)) {
  const a = new window.Audio(url); a.preload = 'auto'
      this.cache.set(name, a)
    }
  }

  init() {
    if (this.started) return
    this.started = true
    this.load('click', '/sfx/click.mp3')
    this.load('success', '/sfx/success.mp3')
    this.load('fail', '/sfx/fail.mp3')
    this.load('win', '/sfx/win.mp3')
    this.load('lose', '/sfx/lose.mp3')
  this.bg = new window.Audio('/sfx/bgm.mp3'); this.bg.loop = true; (this.bg as HTMLAudioElement).volume = 0.25
    if (this.bgmOn) (this.bg as HTMLAudioElement).play().catch(()=>{})
  }

  play(name: 'click'|'success'|'fail'|'win'|'lose') {
    if (!this.sfxOn) return
    const a = this.cache.get(name)
    if (a) { a.currentTime = 0; a.play().catch(()=>{}) }
  }

  toggleSfx() { this.sfxOn = !this.sfxOn; localStorage.setItem('bh.sfx', this.sfxOn?'on':'off'); return this.sfxOn }
  toggleBgm() {
    this.bgmOn = !this.bgmOn; localStorage.setItem('bh.bgm', this.bgmOn?'on':'off')
    if (!this.bg) return this.bgmOn
    if (this.bgmOn) (this.bg as HTMLAudioElement).play().catch(()=>{}); else (this.bg as HTMLAudioElement).pause()
    return this.bgmOn
  }
}
export const Audio = new AudioManager()

