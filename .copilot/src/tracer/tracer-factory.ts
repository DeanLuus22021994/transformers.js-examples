import path from 'path';
import { CoreTracer } from './core-tracer';
import { TerminalTracer } from './terminal-tracer';
import { ITracer, ITerminalTracer } from './types';

/**
 * Factory class for creating different types of tracers
 * Following Factory Pattern for object creation
 */
export class TracerFactory {
  private static instance: TracerFactory;
  private baseDir: string;
  private tracers: Map<string, ITracer> = new Map();

  private constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Get singleton instance of the factory
   */
  public static getInstance(baseDir?: string): TracerFactory {
    if (!TracerFactory.instance) {
      if (!baseDir) {
        throw new Error('Base directory is required for first initialization');
      }
      TracerFactory.instance = new TracerFactory(baseDir);
    }
    return TracerFactory.instance;
  }

  /**
   * Create a core tracer
   */
  public createCoreTracer(name: string): ITracer {
    if (this.tracers.has(name)) {
      return this.tracers.get(name)!;
    }

    const tracer = new CoreTracer(path.join(this.baseDir, name));
    this.tracers.set(name, tracer);
    return tracer;
  }

  /**
   * Create a terminal tracer
   */
  public createTerminalTracer(name: string): ITerminalTracer {
    if (this.tracers.has(name)) {
      const tracer = this.tracers.get(name);
      if (tracer instanceof TerminalTracer) {
        return tracer;
      }
      throw new Error(`Tracer with name ${name} exists but is not a TerminalTracer`);
    }

    const tracer = new TerminalTracer(path.join(this.baseDir, name));
    this.tracers.set(name, tracer);
    return tracer;
  }

  /**
   * Archive all active tracers
   */
  public archiveAll(): Record<string, string> {
    const archives: Record<string, string> = {};

    for (const [name, tracer] of this.tracers.entries()) {
      archives[name] = tracer.archive();
    }

    return archives;
  }
}