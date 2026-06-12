import { Injectable, Logger } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface DispatchPayload {
  event: string;
  serviceId: string;
  serviceName: string;
  title: string;
  message: string;
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async dispatch(event: string, payload: DispatchPayload) {
    const channels = await this.prisma.channel.findMany({
      where: { enabled: true },
    });

    for (const channel of channels) {
      if (!channel.events.includes(event)) continue;
      if (channel.serviceIds.length && !channel.serviceIds.includes(payload.serviceId)) continue;

      try {
        if (channel.type === ChannelType.DISCORD) {
          await this.sendDiscord(channel.config as Record<string, string>, payload);
        } else if (channel.type === ChannelType.TELEGRAM) {
          await this.sendTelegram(channel.config as Record<string, string>, payload);
        }
      } catch (err) {
        this.logger.warn(`Échec dispatch ${channel.name}: ${err}`);
      }
    }
  }

  private async sendDiscord(config: Record<string, string>, payload: DispatchPayload) {
    const webhookUrl = config.webhookUrl;
    if (!webhookUrl) return;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `[${payload.event}] ${payload.title}`,
          description: payload.message,
          color: payload.event === 'ALERT_RESOLVED' ? 0x22c55e : 0xef4444,
          fields: [
            { name: 'Service', value: payload.serviceName, inline: true },
            { name: 'Événement', value: payload.event, inline: true },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  }

  private async sendTelegram(config: Record<string, string>, payload: DispatchPayload) {
    const { botToken, chatId } = config;
    if (!botToken || !chatId) return;

    const text = `*${payload.event}*\n*${payload.title}*\n${payload.message}\n_Service: ${payload.serviceName}_`;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  }
}
