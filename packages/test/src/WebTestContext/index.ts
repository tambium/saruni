import { RequestHandlersList } from 'msw/lib/types/setupWorker/glossary';
import { setupServer } from 'msw/node';

export const createWebTestContext = (handlers: RequestHandlersList) => {
  const worker = setupServer(...handlers);

  beforeAll(() => {
    worker.listen();
  });

  afterAll(() => {
    worker.close();
  });

  return { worker };
};

export const mockNextRouter = () => {
  return jest.mock('next/router', () => {
    const push = jest.fn();

    const useRouter = jest.fn().mockImplementation(() => {
      return {
        push,
      };
    });
    return {
      useRouter,
    };
  });
};
