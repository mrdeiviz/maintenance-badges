import { describe, it, expect, beforeEach } from 'vitest';
import { BadgeGeneratorService } from '../../../src/services/badge-generator.service';
import type { BadgeOptions } from '../../../src/types/funding-data.types';

describe('BadgeGeneratorService', () => {
  let service: BadgeGeneratorService;

  beforeEach(() => {
    service = new BadgeGeneratorService();
  });

  describe('generateFundingBadge', () => {
    it('should generate a valid SVG badge with default options', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 2500,
        goal: 5000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('<svg');
      expect(badge).toContain('</svg>');
      expect(badge).toContain('Funding');
      expect(badge).toContain('$2.5k / $5.0k (50%)');
    });

    it('should use custom label', () => {
      const options: BadgeOptions = {
        label: 'Maintenance Fund',
        current: 1000,
        goal: 2000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('Maintenance Fund');
    });

    it('should format amounts correctly for thousands', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 3500,
        goal: 10000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('$3.5k / $10.0k');
      expect(badge).toContain('(35%)');
    });

    it('should format amounts correctly for millions', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 1500000,
        goal: 2000000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('$1.5M / $2.0M');
      expect(badge).toContain('(75%)');
    });

    it('should format small amounts without abbreviation', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 500,
        goal: 999,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('$500 / $999');
      expect(badge).toContain('(50%)');
    });

    it('should apply correct color for critical progress (<20%)', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 100,
        goal: 1000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('e74c3c'); // red
    });

    it('should apply correct color for needs attention progress (20-40%)', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 300,
        goal: 1000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('e67e22'); // orange
    });

    it('should apply correct color for moderate progress (40-60%)', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 500,
        goal: 1000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('f39c12'); // yellow-orange
    });

    it('should apply correct color for good progress (60-80%)', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 700,
        goal: 1000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('f1c40f'); // yellow
    });

    it('should apply correct color for almost there progress (80-100%)', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 900,
        goal: 1000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('2ecc71'); // green
    });

    it('should apply correct color for goal reached (100-150%)', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 1200,
        goal: 1000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('27ae60'); // darker green
    });

    it('should apply correct color for exceeded goal (>150%)', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 2000,
        goal: 1000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('9b59b6'); // purple
    });

    it('should use custom color when provided', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 500,
        goal: 1000,
        style: 'flat',
        color: 'blue',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('blue');
    });

    it('should support different badge styles', () => {
      const styles: Array<'flat' | 'flat-square' | 'plastic' | 'for-the-badge' | 'social'> = [
        'flat',
        'flat-square',
        'plastic',
      ];

      styles.forEach((style) => {
        const options: BadgeOptions = {
          label: 'Funding',
          current: 500,
          goal: 1000,
          style,
        };

        const badge = service.generateFundingBadge(options);

        expect(badge).toContain('<svg');
        expect(badge).toContain('</svg>');
      });
    });

    it('should round percentages to nearest integer', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 333,
        goal: 1000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('(33%)');
    });

    it('should handle 0% progress', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 0,
        goal: 1000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('$0 / $1.0k (0%)');
      expect(badge).toContain('e74c3c'); // red for critical
    });

    it('should handle 100% progress', () => {
      const options: BadgeOptions = {
        label: 'Funding',
        current: 1000,
        goal: 1000,
        style: 'flat',
      };

      const badge = service.generateFundingBadge(options);

      expect(badge).toContain('$1.0k / $1.0k (100%)');
      expect(badge).toContain('27ae60'); // darker green
    });
  });

  describe('generateErrorBadge', () => {
    it('should generate error badge with default message', () => {
      const badge = service.generateErrorBadge();

      expect(badge).toContain('<svg');
      expect(badge).toContain('Maintenance Fund');
      expect(badge).toContain('Error');
      expect(badge).toContain('lightgrey');
    });

    it('should generate error badge with custom message', () => {
      const badge = service.generateErrorBadge('Not Found');

      expect(badge).toContain('<svg');
      expect(badge).toContain('Maintenance Fund');
      expect(badge).toContain('Not Found');
      expect(badge).toContain('lightgrey');
    });

    it('should use flat-square style for error badges', () => {
      const badge = service.generateErrorBadge('Unauthorized');

      expect(badge).toContain('Unauthorized');
    });
  });
});
