import { makeBadge, Format } from "badge-maker";
import type { BadgeOptions } from "../types/funding-data.types.js";

export class BadgeGeneratorService {
  generateFundingBadge(options: BadgeOptions): string {
    const percentage = (options.current / options.goal) * 100;
    const color = options.color || this.getProgressColor(percentage);

    const format: Format = {
      label: options.label,
      message: this.formatMessage(options.current, options.goal),
      color: color,
      style: options.style,
    };

    const baseBadge = makeBadge(format);
    const widenedBadge = this.widenMessageSegment(baseBadge, 200);
    return widenedBadge;
  }

  generateErrorBadge(message: string = "Error"): string {
    const format: Format = {
      label: "Maintenance Fund",
      message: message,
      color: "lightgrey",
      style: "flat-square",
    };

    return makeBadge(format);
  }

  private getProgressColor(percentage: number): string {
    if (percentage < 20) return "e74c3c"; // red - critical
    if (percentage < 40) return "e67e22"; // orange - needs attention
    if (percentage < 60) return "f39c12"; // yellow-orange
    if (percentage < 80) return "f1c40f"; // yellow
    if (percentage < 100) return "2ecc71"; // green - almost there
    if (percentage < 150) return "27ae60"; // darker green - goal reached
    return "9b59b6"; // purple - exceeded goal!
  }

  private formatMessage(current: number, goal: number): string {
    const percentage = Math.round((current / goal) * 100);
    return `$${this.formatAmount(current)} / $${this.formatAmount(goal)} (${percentage}%)`;
  }

  private formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}k`;
    }
    return amount.toFixed(0);
  }

  private widenMessageSegment(
    svgString: string,
    minMessageWidth: number,
  ): string {
    const rectMatch = svgString.match(
      /<rect width="(\d+)" height="\d+" fill="[^"]+"\/><rect x="\d+" width="(\d+)" height="\d+" fill="[^"]+"\/>/,
    );
    if (!rectMatch) {
      return svgString;
    }

    const labelWidth = parseInt(rectMatch[1]);
    const messageWidth = parseInt(rectMatch[2]);
    if (messageWidth >= minMessageWidth) {
      return svgString;
    }

    const newMessageWidth = minMessageWidth;
    const newTotalWidth = labelWidth + newMessageWidth;

    let updated = svgString.replace(
      /<svg ([^>]*?)width="\d+" height="(\d+)"/,
      `<svg $1width="${newTotalWidth}" height="$2"`,
    );

    updated = updated.replace(
      new RegExp(
        `<rect x="${labelWidth}" width="\\d+" height="(\\d+)" fill="([^"]+)"/>`,
      ),
      `<rect x="${labelWidth}" width="${newMessageWidth}" height="$1" fill="$2"/>`,
    );

    const textMatches = Array.from(
      updated.matchAll(
        /<text x="(\d+)" y="(\d+)" transform="scale\(\.1\)"[^>]*>/g,
      ),
    );
    if (textMatches.length >= 4) {
      const newMessageX = Math.round((labelWidth + newMessageWidth / 2) * 10);
      const messageTextNodes = textMatches.slice(-2);
      for (const messageText of messageTextNodes) {
        const startIndex = messageText.index ?? -1;
        if (startIndex >= 0) {
          const original = messageText[0];
          const replacement = original.replace(/x="\d+"/, `x="${newMessageX}"`);
          updated =
            updated.slice(0, startIndex) +
            replacement +
            updated.slice(startIndex + original.length);
        }
      }
    }

    return updated;
  }
}

let badgeGeneratorServiceInstance: BadgeGeneratorService | null = null;

export function createBadgeGeneratorService(): BadgeGeneratorService {
  if (!badgeGeneratorServiceInstance) {
    badgeGeneratorServiceInstance = new BadgeGeneratorService();
  }
  return badgeGeneratorServiceInstance;
}

export function getBadgeGeneratorService(): BadgeGeneratorService {
  if (!badgeGeneratorServiceInstance) {
    throw new Error("Badge generator service not initialized.");
  }
  return badgeGeneratorServiceInstance;
}
