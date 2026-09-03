import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, BellRing, Plus, Minus } from 'lucide-react';
import Button from '../ui/Button';

const PRESET_MINUTES = [5, 10, 15, 20, 30];

const CookingTimer = () => {
  const [totalSeconds, setTotalSeconds] = useState(10 * 60); // Default 10 min
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  const audioRef = useRef(null);

  // Countdown effect
  useEffect(() => {
    let interval = null;

    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setTimerFinished(true);
            playAlarmSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  // Audio cue placeholder (Web Audio API synthesized chime for zero external dependency)
  const playAlarmSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  };

  const handleStart = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(totalSeconds);
    }
    setIsRunning(true);
    setTimerFinished(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    setTimerFinished(false);
  };

  const handlePresetSelect = (minutes) => {
    const s = minutes * 60;
    setTotalSeconds(s);
    setSecondsLeft(s);
    setIsRunning(false);
    setTimerFinished(false);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const mins = parseInt(customMinutes, 10);
    if (mins && mins > 0 && mins <= 180) {
      handlePresetSelect(mins);
      setCustomMinutes('');
    }
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPct = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <Timer size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Kitchen Timer
            </h3>
            <span className="text-[11px] text-[var(--color-sage)] font-semibold">
              Precision step countdown
            </span>
          </div>
        </div>

        {timerFinished && (
          <span className="text-[11px] font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 animate-pulse flex items-center gap-1">
            <BellRing size={11} />
            <span>Time's Up!</span>
          </span>
        )}
      </div>

      {/* Big Display Clock */}
      <div
        className={`p-5 rounded-2xl text-center border transition-all ${
          timerFinished
            ? 'bg-red-50 border-red-200'
            : isRunning
            ? 'bg-[var(--color-parchment)] border-[var(--color-sage)]'
            : 'bg-[var(--color-parchment)]/60 border-[rgba(138,144,112,0.12)]'
        }`}
      >
        <span
          className={`text-4xl font-extrabold tracking-wider tabular-nums block ${
            timerFinished ? 'text-red-600' : 'text-[var(--color-dark)]'
          }`}
        >
          {formatTime(secondsLeft)}
        </span>

        {/* Mini progress line */}
        <div className="h-1.5 w-3/4 mx-auto bg-white rounded-full overflow-hidden mt-3 border border-[rgba(138,144,112,0.15)]">
          <div
            className={`h-full transition-all duration-300 ${
              timerFinished ? 'bg-red-500' : 'bg-[var(--color-sage)]'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Control Actions (Start / Pause / Reset) */}
      <div className="flex items-center justify-center gap-2">
        {isRunning ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Pause}
            onClick={handlePause}
            className="flex-1"
          >
            Pause
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Play}
            onClick={handleStart}
            className="flex-1"
          >
            Start
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={handleReset}
          aria-label="Reset timer"
        />
      </div>

      {/* Presets Row */}
      <div className="space-y-1.5 pt-2 border-t border-[rgba(138,144,112,0.10)]">
        <span className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-wider block">
          Quick Presets
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_MINUTES.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => handlePresetSelect(min)}
              className="px-2.5 py-1 rounded-lg bg-[var(--color-parchment)] text-xs font-bold text-[var(--color-bark)] hover:bg-[var(--color-sage)] hover:text-white transition-all shadow-xs"
            >
              {min}m
            </button>
          ))}
        </div>
      </div>

      {/* Custom timer input */}
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1">
        <input
          type="number"
          min="1"
          max="180"
          value={customMinutes}
          onChange={(e) => setCustomMinutes(e.target.value)}
          placeholder="Custom mins"
          aria-label="Custom timer minutes"
          className="input py-1.5 text-xs flex-1"
        />
        <Button type="submit" variant="secondary" size="sm" className="text-xs font-bold">
          Set
        </Button>
      </form>
    </div>
  );
};

export default CookingTimer;
