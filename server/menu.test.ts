import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import { createEvent, deleteEvent } from './db';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createEmployeeContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-employee',
    email: 'employee@manor.com',
    name: 'Test Employee',
    loginMethod: 'local',
    role: 'employee',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: () => {},
    } as TrpcContext['res'],
  };

  return { ctx };
}

describe('Menu Management', () => {
  let testEventId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const { ctx } = createEmployeeContext();
    caller = appRouter.createCaller(ctx);

    // Create test event
    testEventId = await createEvent({
      title: 'Menu Test Event',
      eventDate: new Date('2026-06-15'),
      createdById: ctx.user!.id,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await deleteEvent(testEventId);
  });

  it('should create menu items with course names', async () => {
    const starter = await caller.menu.create({
      eventId: testEventId,
      course: 'Starter',
      name: 'Caesar Salad',
      description: 'Classic Caesar with parmesan',
      orderIndex: 100,
    });

    expect(starter.course).toBe('Starter');
    expect(starter.name).toBe('Caesar Salad');
  });

  it('should support custom course names beyond starter/main/dessert', async () => {
    const canape = await caller.menu.create({
      eventId: testEventId,
      course: 'Canapés',
      name: 'Smoked Salmon Blini',
      description: 'With crème fraîche',
      orderIndex: 50, // Before Starter which is at 100
    });

    expect(canape.course).toBe('Canapés');
    expect(canape.name).toBe('Smoked Salmon Blini');
  });

  it('should list all menu items for an event', async () => {
    const items = await caller.menu.list({ eventId: testEventId });
    
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.some(item => item.course === 'Starter')).toBe(true);
    expect(items.some(item => item.course === 'Canapés')).toBe(true);
  });

  it('should update menu item details', async () => {
    const items = await caller.menu.list({ eventId: testEventId });
    const starterItem = items.find(item => item.course === 'Starter');
    
    if (!starterItem) throw new Error('Starter item not found');

    const updated = await caller.menu.update({
      id: starterItem.id,
      name: 'Caesar Salad Deluxe',
      description: 'With anchovies and extra parmesan',
      orderIndex: starterItem.orderIndex,
    });

    expect(updated.name).toBe('Caesar Salad Deluxe');
    expect(updated.description).toBe('With anchovies and extra parmesan');
  });

  it('should support course reordering via orderIndex', async () => {
    // Create multiple courses with different orderIndex values
    await caller.menu.create({
      eventId: testEventId,
      course: 'Main',
      name: 'Beef Wellington',
      description: 'With truffle sauce',
      orderIndex: 200, // Main should come after Starter (100)
    });

    await caller.menu.create({
      eventId: testEventId,
      course: 'Dessert',
      name: 'Chocolate Fondant',
      description: 'With vanilla ice cream',
      orderIndex: 300, // Dessert should come last
    });

    const items = await caller.menu.list({ eventId: testEventId });
    
    // Group by course and find min orderIndex for each
    const courseOrder = items.reduce((acc, item) => {
      if (!acc[item.course] || item.orderIndex < acc[item.course]) {
        acc[item.course] = item.orderIndex;
      }
      return acc;
    }, {} as Record<string, number>);

    // Verify courses are in correct order
    expect(courseOrder['Canapés']).toBeLessThan(courseOrder['Starter']);
    expect(courseOrder['Starter']).toBeLessThan(courseOrder['Main']);
    expect(courseOrder['Main']).toBeLessThan(courseOrder['Dessert']);
  });

  it('should update orderIndex when reordering courses', async () => {
    const items = await caller.menu.list({ eventId: testEventId });
    const mainItem = items.find(item => item.course === 'Main');
    
    if (!mainItem) throw new Error('Main item not found');

    // Move Main course to position 50 (before Starter at 100)
    const updated = await caller.menu.update({
      id: mainItem.id,
      name: mainItem.name,
      description: mainItem.description || undefined,
      orderIndex: 50,
    });

    expect(updated.orderIndex).toBe(50);

    // Verify new order
    const updatedItems = await caller.menu.list({ eventId: testEventId });
    const courseOrder = updatedItems.reduce((acc, item) => {
      if (!acc[item.course] || item.orderIndex < acc[item.course]) {
        acc[item.course] = item.orderIndex;
      }
      return acc;
    }, {} as Record<string, number>);

    expect(courseOrder['Main']).toBeLessThan(courseOrder['Starter']);
  });

  it('should delete menu items', async () => {
    const items = await caller.menu.list({ eventId: testEventId });
    const canapeItem = items.find(item => item.course === 'Canapés');
    
    if (!canapeItem) throw new Error('Canapé item not found');

    await caller.menu.delete({ id: canapeItem.id });

    const updatedItems = await caller.menu.list({ eventId: testEventId });
    expect(updatedItems.some(item => item.id === canapeItem.id)).toBe(false);
  });

  it('should delete all items in a course when course is deleted', async () => {
    // Create multiple items in a test course
    await caller.menu.create({
      eventId: testEventId,
      course: 'Cheese',
      name: 'Brie',
      description: 'French soft cheese',
      orderIndex: 400,
    });

    await caller.menu.create({
      eventId: testEventId,
      course: 'Cheese',
      name: 'Cheddar',
      description: 'Aged cheddar',
      orderIndex: 400,
    });

    // Delete all items in the Cheese course
    await caller.menu.deleteCourse({ eventId: testEventId, course: 'Cheese' });

    const items = await caller.menu.list({ eventId: testEventId });
    expect(items.some(item => item.course === 'Cheese')).toBe(false);
  });
});
