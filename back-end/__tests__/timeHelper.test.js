import { formatTime, formatTime24, addMinutes } from '../services/timeHelper.service.js';

describe('formatTime', () => {

  test('UT-09: valid afternoon time formats correctly', () => {
    const date = new Date();
    date.setHours(14, 35, 0, 0);
    expect(formatTime(date)).toBe('2:35 PM');
  });

  test('UT-10: midnight formats correctly', () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    expect(formatTime(date)).toMatch(/12:00 AM/);
  });

  test('UT-11: invalid date returns fallback string', () => {
    expect(formatTime(new Date('invalid'))).toBe('--:-- --');
  });

});

describe('formatTime24', () => {

  test('UT-12: single digit hour gets leading zero', () => {
    const date = new Date();
    date.setHours(9, 5, 0, 0);
    expect(formatTime24(date)).toBe('09:05');
  });

});

describe('addMinutes', () => {

  test('UT-13: adds minutes correctly', () => {
    const base = new Date();
    base.setHours(14, 0, 0, 0);
    const result = addMinutes(base, 15);
    expect(formatTime(result)).toBe('2:15 PM');
  });

  test('UT-14: adding minutes that cross midnight', () => {
    const base = new Date();
    base.setHours(23, 50, 0, 0);
    const result = addMinutes(base, 20);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(10);
  });

});