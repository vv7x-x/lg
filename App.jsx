import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  Power, 
  VolumeX, 
  Volume2, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Home,
  Settings,
  RotateCcw,
  Circle,
  Wifi,
  WifiOff
} from 'lucide-react'
import './App.css'

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [currentChannel, setCurrentChannel] = useState(1)
  const [tvStatus, setTvStatus] = useState('disconnected') // 'connected', 'disconnected', 'connecting'

  // محاكاة حالة الاتصال
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnected(true)
      setTvStatus('connected')
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handlePowerToggle = async () => {
    try {
      const response = await fetch('/api/power', { method: 'POST' })
      if (response.ok) {
        console.log('Power command sent')
      }
    } catch (error) {
      console.error('Error sending power command:', error)
    }
  }

  const handleVolumeUp = async () => {
    try {
      const response = await fetch('/api/volume/up', { method: 'POST' })
      if (response.ok) {
        setVolume(prev => Math.min(prev + 5, 100))
      }
    } catch (error) {
      console.error('Error sending volume up command:', error)
    }
  }

  const handleVolumeDown = async () => {
    try {
      const response = await fetch('/api/volume/down', { method: 'POST' })
      if (response.ok) {
        setVolume(prev => Math.max(prev - 5, 0))
      }
    } catch (error) {
      console.error('Error sending volume down command:', error)
    }
  }

  const handleMuteToggle = async () => {
    try {
      const response = await fetch('/api/volume/mute', { method: 'POST' })
      if (response.ok) {
        setIsMuted(prev => !prev)
      }
    } catch (error) {
      console.error('Error sending mute command:', error)
    }
  }

  const handleChannelUp = async () => {
    try {
      const response = await fetch('/api/channel/up', { method: 'POST' })
      if (response.ok) {
        setCurrentChannel(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error sending channel up command:', error)
    }
  }

  const handleChannelDown = async () => {
    try {
      const response = await fetch('/api/channel/down', { method: 'POST' })
      if (response.ok) {
        setCurrentChannel(prev => Math.max(prev - 1, 1))
      }
    } catch (error) {
      console.error('Error sending channel down command:', error)
    }
  }

  const handleDirectionClick = async (direction) => {
    try {
      const response = await fetch(`/api/navigate/${direction}`, { method: 'POST' })
      if (response.ok) {
        console.log(`Navigation ${direction} sent`)
      }
    } catch (error) {
      console.error(`Error sending ${direction} command:`, error)
    }
  }

  const handleNumberClick = async (number) => {
    try {
      const response = await fetch(`/api/number/${number}`, { method: 'POST' })
      if (response.ok) {
        console.log(`Number ${number} sent`)
      }
    } catch (error) {
      console.error(`Error sending number ${number}:`, error)
    }
  }

  const handleSpecialCommand = async (command) => {
    try {
      const response = await fetch(`/api/command/${command}`, { method: 'POST' })
      if (response.ok) {
        console.log(`Command ${command} sent`)
      }
    } catch (error) {
      console.error(`Error sending ${command} command:`, error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-slate-800">
                التحكم عن بُعد
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isConnected ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isConnected ? "متصل" : "غير متصل"}
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handlePowerToggle}
                  className="rounded-full p-2"
                >
                  <Power className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Controls */}
        <Card className="mb-4">
          <CardContent className="p-6">
            {/* Volume and Channel Controls */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Volume Controls */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleVolumeUp}
                  className="h-12 rounded-xl"
                >
                  <div className="flex flex-col items-center">
                    <ChevronUp className="w-5 h-5" />
                    <span className="text-xs">VOL</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleVolumeDown}
                  className="h-12 rounded-xl"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>

              {/* Mute Button */}
              <div className="flex justify-center">
                <Button
                  variant={isMuted ? "destructive" : "outline"}
                  size="lg"
                  onClick={handleMuteToggle}
                  className="w-16 h-16 rounded-full"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </Button>
              </div>

              {/* Channel Controls */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleChannelUp}
                  className="h-12 rounded-xl"
                >
                  <div className="flex flex-col items-center">
                    <ChevronUp className="w-5 h-5" />
                    <span className="text-xs">CH</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleChannelDown}
                  className="h-12 rounded-xl"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Function Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Button
                variant="outline"
                onClick={() => handleSpecialCommand('back')}
                className="h-12 rounded-xl"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSpecialCommand('home')}
                className="h-12 rounded-xl"
              >
                <Home className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSpecialCommand('settings')}
                className="h-12 rounded-xl"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Pad */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="relative w-32 h-32 mx-auto mb-4">
              {/* Navigation Circle */}
              <div className="absolute inset-0 rounded-full border-2 border-slate-200 bg-slate-50">
                {/* Up */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDirectionClick('up')}
                  className="absolute top-1 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                {/* Down */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDirectionClick('down')}
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                {/* Left */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDirectionClick('left')}
                  className="absolute left-1 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {/* Right */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDirectionClick('right')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {/* Center OK Button */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleDirectionClick('ok')}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full"
                >
                  <Circle className="w-4 h-4 fill-current" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Number Pad */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <Button
                  key={number}
                  variant="outline"
                  size="lg"
                  onClick={() => handleNumberClick(number)}
                  className="h-12 rounded-xl text-lg font-semibold"
                >
                  {number}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleSpecialCommand('list')}
                className="h-12 rounded-xl text-sm"
              >
                -/LIST
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleNumberClick(0)}
                className="h-12 rounded-xl text-lg font-semibold"
              >
                0
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleSpecialCommand('more')}
                className="h-12 rounded-xl text-sm"
              >
                ...
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Display */}
        <div className="mt-4 text-center text-sm text-slate-600">
          <p>القناة: {currentChannel} | الصوت: {isMuted ? 'مكتوم' : volume}</p>
        </div>
      </div>
    </div>
  )
}

export default App

