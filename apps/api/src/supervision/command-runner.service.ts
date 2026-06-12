import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { EventsGateway } from '../events/events.gateway';
import { WS_EVENTS } from '@lutron/shared';

const execAsync = promisify(exec);

interface StreamHandle {
  process: ReturnType<typeof spawn>;
}

@Injectable()
export class CommandRunnerService implements OnModuleDestroy {
  private readonly logger = new Logger(CommandRunnerService.name);
  private readonly streams = new Map<string, StreamHandle>();

  constructor(private readonly events: EventsGateway) {}

  onModuleDestroy() {
    for (const [id, handle] of this.streams) {
      handle.process.kill();
      this.streams.delete(id);
    }
  }

  async runOnce(command: string, cwd?: string, timeoutMs = 30000): Promise<{ output: string; exitCode: number }> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || process.cwd(),
        timeout: timeoutMs,
        maxBuffer: 1024 * 512,
        shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/sh',
      });
      return { output: (stdout + stderr).trim() || '(aucune sortie)', exitCode: 0 };
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; code?: number; message?: string };
      const output = [e.stdout, e.stderr, e.message].filter(Boolean).join('\n');
      return { output: output || 'Erreur d\'exécution', exitCode: e.code ?? 1 };
    }
  }

  async runRemote(config: Record<string, string>, command: string): Promise<{ output: string; exitCode: number }> {
    const host = config.host;
    const user = config.user ?? 'root';
    if (!host) {
      return { output: 'Hôte distant non configuré', exitCode: 1 };
    }
    const sshCommand = `ssh ${user}@${host} "${command.replace(/"/g, '\\"')}"`;
    return this.runOnce(sshCommand, undefined, 60000);
  }

  startLogStream(widgetId: string, command: string, cwd?: string) {
    this.stopLogStream(widgetId);

    const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/sh';
    const shellFlag = process.platform === 'win32' ? '-Command' : '-c';
    const proc = spawn(shell, [shellFlag, command], { cwd: cwd || process.cwd() });

    this.streams.set(widgetId, { process: proc });

    const emit = (line: string, done = false) => {
      this.events.emit(WS_EVENTS.WIDGET_OUTPUT, { widgetId, line, done, timestamp: new Date().toISOString() });
    };

    proc.stdout.on('data', (data: Buffer) => {
      data.toString().split('\n').filter(Boolean).forEach((line) => emit(line));
    });

    proc.stderr.on('data', (data: Buffer) => {
      data.toString().split('\n').filter(Boolean).forEach((line) => emit(`[stderr] ${line}`));
    });

    proc.on('close', (code) => {
      emit(`--- Processus terminé (code ${code}) ---`, true);
      this.streams.delete(widgetId);
    });

    proc.on('error', (err) => {
      emit(`Erreur: ${err.message}`, true);
      this.streams.delete(widgetId);
    });

    emit(`> ${command}`);
    return { started: true };
  }

  stopLogStream(widgetId: string) {
    const handle = this.streams.get(widgetId);
    if (handle) {
      handle.process.kill();
      this.streams.delete(widgetId);
      return { stopped: true };
    }
    return { stopped: false };
  }
}
