import { useEffect, useRef, useCallback } from 'react';
import { 
  initHighFidelityScene, 
  type HighFidelitySceneContext,
  type HighFidelitySceneOptions 
} from './HighFidelityScene';

interface UseHighFidelitySceneOptions extends Omit<HighFidelitySceneOptions, 'container'> {
  onReady?: (context: HighFidelitySceneContext) => void;
  autoAnimate?: boolean;
}

/**
 * React hook for managing a high-fidelity Three.js scene
 * with automatic cleanup and resize handling
 */
export const useHighFidelityScene = (options: UseHighFidelitySceneOptions = {}) => {
  const { onReady, autoAnimate = true, ...sceneOptions } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<HighFidelitySceneContext | null>(null);

  const initScene = useCallback(() => {
    if (!containerRef.current || contextRef.current) return;

    const context = initHighFidelityScene({
      container: containerRef.current,
      ...sceneOptions,
    });

    contextRef.current = context;

    if (autoAnimate) {
      context.animate();
    }

    if (onReady) {
      onReady(context);
    }
  }, [autoAnimate, onReady, sceneOptions]);

  useEffect(() => {
    initScene();

    const handleResize = () => {
      contextRef.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      contextRef.current?.dispose();
      contextRef.current = null;
    };
  }, [initScene]);

  const loadModel = useCallback(async (url: string, partName: string) => {
    if (!contextRef.current) {
      throw new Error('Scene not initialized');
    }
    return contextRef.current.loadFirearmPart(url, partName);
  }, []);

  const loadHDR = useCallback(async (url: string) => {
    if (!contextRef.current) {
      throw new Error('Scene not initialized');
    }
    return contextRef.current.loadHDREnvironment(url);
  }, []);

  const getContext = useCallback(() => contextRef.current, []);

  return {
    containerRef,
    loadModel,
    loadHDR,
    getContext,
  };
};
