import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            root: jest.fn(),
          },
        }
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined();
    });
  });

  describe('getRequestUser', () => {
      it('should return user from request', () => {
          const mockUser = { id: 1, name: 'Test' };
          const mockReq = { user: mockUser };
          expect(appController.getRequestUser(mockReq)).toEqual(mockUser);
      });
  });
});
