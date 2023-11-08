import React, { useRef, useMemo, useReducer, useCallback, useEffect, Children, cloneElement, isValidElement } from 'react';
import { Controller, Events } from './controller';
import { isStringOrNumber, stripPunctuation } from './utils';
import { Highlighter } from './highlighter';
/**
 * Event handler for a TTS event:
 * - `onStart`
 * - `onPause`
 * - `onEnd`
 *
 * If not using `fetchAudioData` then the event will be `SpeechSynthesisEvent`.
 * Otherwise, the event will be the generic `Event` type used by `HTMLAudioElement`.
 */

import { jsx as _jsx } from "react/jsx-runtime";
import { Fragment as _Fragment } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";

const parseChildrenRecursively = _ref => {
  let {
    children,
    buffer,
    boundary,
    markColor,
    markBackgroundColor,
    markTextAsSpoken
  } = _ref;
  return Children.map(children, child => {
    let currentChild = child;

    if ( /*#__PURE__*/isValidElement(child)) {
      currentChild = /*#__PURE__*/cloneElement(child, { ...child.props,
        children: parseChildrenRecursively({
          buffer,
          boundary,
          markColor,
          markBackgroundColor,
          markTextAsSpoken,
          children: child.props.children
        })
      });
    }

        if (child && !isStringOrNumber(child) && child.props && child.props.value && child.props.name.includes("hlt")) {
    child = extractContent(child.props.value)
    }


function extractContent(s) {
  var span = document.createElement('span');
  span.innerHTML = s;
  return span.textContent || span.innerText;
};

    if (isStringOrNumber(child)) {
      const text = child.toString();
      const {
        word,
        startChar,
        endChar
      } = boundary;
      const bufferTextLength = buffer.text.length;
      buffer.text += `${text} `;

      if (markTextAsSpoken && word) {
        const start = startChar - bufferTextLength;
        const end = endChar - bufferTextLength;
        const prev = text.substring(0, start);
        const found = text.substring(start, end);
        const after = text.substring(end, text.length);

        if (found) {
          return /*#__PURE__*/_jsxs(_Fragment, {
            children: [prev, /*#__PURE__*/_jsx(Highlighter, {
              text: found,
              mark: stripPunctuation(found),
              color: markColor,
              backgroundColor: markBackgroundColor
            }), after]
          });
        }
      }
    }

    return currentChild;
  });
};

const defaultBoundary = {
  word: '',
  startChar: 0,
  endChar: 0
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'pause':
      return { ...state,
        isPlaying: false,
        isPaused: true,
        isError: false
      };

    case 'play':
    case 'reset':
      return { ...state,
        isPlaying: true,
        isPaused: false,
        isError: false,
        boundary: defaultBoundary
      };

    case 'end':
      return { ...state,
        isPlaying: false,
        isPaused: false,
        isError: false,
        boundary: defaultBoundary
      };

    case 'error':
      return { ...state,
        isPlaying: false,
        isPaused: false,
        isError: true,
        boundary: defaultBoundary
      };

    case 'ready':
      return { ...state,
        isReady: true
      };

    case 'boundary':
      return { ...state,
        boundary: { ...state.boundary,
          ...action.payload
        }
      };

    case 'voices':
      return { ...state,
        voices: action.payload
      };

    case 'stop':
      return { ...state,
        isPlaying: false,
        isPaused: false,
        isError: false
      };

    case 'muted':
      return { ...state,
        isMuted: true
      };

    case 'unmuted':
      return { ...state,
        isMuted: false
      };
  }
};

const useTts = _ref2 => {
  var _window$speechSynthes;

  let {
    lang,
    rate,
    volume,
    voice,
    children,
    markColor,
    markBackgroundColor,
    onStart,
    onPause,
    onBoundary,
    onEnd,
    onError,
    onVolumeChange,
    onPitchChange,
    onRateChange,
    fetchAudioData,
    autoPlay = false,
    markTextAsSpoken = false
  } = _ref2;
  const spokenTextRef = useRef();
  const [state, dispatch] = useReducer(reducer, {
    voices: ((_window$speechSynthes = window.speechSynthesis) === null || _window$speechSynthes === void 0 ? void 0 : _window$speechSynthes.getVoices()) ?? [],
    boundary: defaultBoundary,
    isPlaying: false,
    isPaused: false,
    isMuted: false,
    isError: false,
    isReady: typeof fetchAudioData === 'undefined'
  });
  const [ttsChildren, spokenText] = useMemo(() => {
    if (typeof spokenTextRef.current === 'undefined' || markTextAsSpoken) {
      const buffer = {
        text: ''
      };
      const parsed = parseChildrenRecursively({
        children,
        buffer,
        markColor,
        markBackgroundColor,
        markTextAsSpoken,
        boundary: state.boundary
      });
      spokenTextRef.current = buffer.text.trim();
      return [parsed, spokenTextRef.current];
    }

    return [children, spokenTextRef.current];
  }, [children, state.boundary, markColor, markBackgroundColor, markTextAsSpoken]);
  const controller = useMemo(() => new Controller({
    lang,
    voice,
    fetchAudioData
  }), [lang, voice, fetchAudioData]);
  const play = useCallback(async () => {
    if (state.isPaused) {
      controller.resume();
    } else {
      // Replay gives a more consistent/expected experience
      controller.replay();
    }

    dispatch({
      type: 'play'
    });
  }, [controller, state.isPaused]);
  const pause = useCallback(() => {
    controller.pause();
    dispatch({
      type: 'pause'
    });
  }, [controller]);
  const replay = useCallback(() => {
    controller.replay();
    dispatch({
      type: 'reset'
    });
  }, [controller]);
  const stop = useCallback(() => {
    controller.cancel();
    dispatch({
      type: 'stop'
    });
  }, [controller]);
  const toggleMuteHandler = useCallback(callback => {
    const wasMuted = parseFloat(controller.volume.toFixed(2)) === controller.volumeMin;

    if (wasMuted) {
      controller.unmute();
      dispatch({
        type: 'unmuted'
      });
    } else {
      controller.mute();
      dispatch({
        type: 'muted'
      });
    }

    if (typeof callback === 'function') {
      callback(wasMuted);
    }
  }, [controller]);
  const playOrPause = useMemo(() => state.isPlaying ? pause : play, [state.isPlaying, pause, play]);
  const playOrStop = useMemo(() => state.isPlaying ? stop : play, [state.isPlaying, stop, play]);
  const [get, set] = useMemo(() => [{
    lang() {
      return controller.lang;
    },

    rate() {
      return controller.rate;
    },

    pitch() {
      return controller.pitch;
    },

    volume() {
      return controller.volume;
    },

    preservesPitch() {
      return controller.preservesPitch;
    }

  }, {
    lang(value) {
      controller.lang = value;
    },

    rate(value) {
      controller.rate = value;
    },

    pitch(value) {
      controller.pitch = value;
    },

    volume(value) {
      controller.volume = value;
    },

    preservesPitch(value) {
      controller.preservesPitch = value;
    }

  }], [controller]); // Controller event listeners

  const onStartHandler = useCallback(evt => {
    dispatch({
      type: 'play'
    });

    if (typeof onStart === 'function') {
      onStart(evt.detail);
    }
  }, [onStart]);
  const onPauseHandler = useCallback(evt => {
    if (typeof onPause === 'function') {
      onPause(evt.detail);
    }
  }, [onPause]);
  const onEndHandler = useCallback(evt => {
    dispatch({
      type: 'end'
    });

    if (typeof onEnd === 'function') {
      onEnd(evt.detail);
    }
  }, [onEnd]);
  const onReady = useCallback(() => {
    dispatch({
      type: 'ready'
    });
  }, []);
  const onErrorHandler = useCallback(evt => {
    dispatch({
      type: 'error'
    });

    if (typeof onError === 'function') {
      onError(evt.detail);
    }
  }, [onError]);
  const onBoundaryHandler = useCallback(evt => {
    dispatch({
      type: 'boundary',
      payload: evt.detail.boundary
    });

    if (typeof onBoundary === 'function') {
      onBoundary(evt.detail.boundary, evt.detail.evt);
    }
  }, [onBoundary]);
  const onVolume = useCallback(evt => {
    const volume = evt.detail;
    const min = controller.volumeMin;

    if (volume === min && controller.volume !== min) {
      dispatch({
        type: 'muted'
      });
    }

    if (volume !== min && controller.volume === min) {
      dispatch({
        type: 'unmuted'
      });
    }

    if (typeof onVolumeChange === 'function') {
      onVolumeChange(volume);
    }
  }, [onVolumeChange, controller]);
  const onPitch = useCallback(evt => {
    if (typeof onPitchChange === 'function') {
      onPitchChange(evt.detail);
    }
  }, [onPitchChange]);
  const onRate = useCallback(evt => {
    if (typeof onRateChange === 'function') {
      onRateChange(evt.detail);
    }
  }, [onRateChange]);
  useEffect(() => {
    controller.text = spokenText;
  }, [spokenText, controller]);
  useEffect(() => {
    if (rate && Number.isFinite(rate)) {
      controller.rate = rate;
    }

    if (volume && Number.isFinite(volume)) {
      controller.volume = volume;
    }
  }, [controller, rate, volume]);
  useEffect(() => {
    const onBeforeUnload = () => {
      controller.cancel();
    };

    const initializeListeners = async () => {
      controller.addEventListener(Events.PLAYING, onStartHandler);
      controller.addEventListener(Events.PAUSED, onPauseHandler);
      controller.addEventListener(Events.END, onEndHandler);
      controller.addEventListener(Events.ERROR, onErrorHandler);
      controller.addEventListener(Events.READY, onReady);
      controller.addEventListener(Events.BOUNDARY, onBoundaryHandler);
      controller.addEventListener(Events.VOLUME, onVolume);
      controller.addEventListener(Events.PITCH, onPitch);
      controller.addEventListener(Events.RATE, onRate);
      window.addEventListener('beforeunload', onBeforeUnload);
      await controller.init();
    };

    initializeListeners();
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      controller.removeEventListener(Events.PLAYING, onStartHandler);
      controller.removeEventListener(Events.PAUSED, onPauseHandler);
      controller.removeEventListener(Events.END, onEndHandler);
      controller.removeEventListener(Events.ERROR, onErrorHandler);
      controller.removeEventListener(Events.READY, onReady);
      controller.removeEventListener(Events.BOUNDARY, onBoundaryHandler);
      controller.removeEventListener(Events.VOLUME, onVolume);
      controller.removeEventListener(Events.PITCH, onPitch);
      controller.removeEventListener(Events.RATE, onRate);
    };
  }, [onStartHandler, onBoundaryHandler, onPauseHandler, onEndHandler, onReady, onErrorHandler, onBoundary, onVolume, onPitch, onRate, controller]);
  useEffect(() => {
    if (autoPlay && state.isReady) {
      controller.replay();
      dispatch({
        type: 'play'
      });
    }
  }, [autoPlay, controller, state.isReady, spokenText]);
  useEffect(() => {
    var _window$speechSynthes2;

    const onVoicesChanged = () => {
      dispatch({
        type: 'voices',
        payload: window.speechSynthesis.getVoices()
      });
    };

    if (typeof ((_window$speechSynthes2 = window.speechSynthesis) === null || _window$speechSynthes2 === void 0 ? void 0 : _window$speechSynthes2.addEventListener) === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    }

    return () => {
      var _window$speechSynthes3;

      if (typeof ((_window$speechSynthes3 = window.speechSynthesis) === null || _window$speechSynthes3 === void 0 ? void 0 : _window$speechSynthes3.removeEventListener) === 'function') {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      }
    };
  }, []);
  return {
    get,
    set,
    state,
    spokenText,
    ttsChildren,
    play,
    stop,
    pause,
    replay,
    playOrStop,
    playOrPause,
    toggleMute: toggleMuteHandler
  };
};

export { useTts };