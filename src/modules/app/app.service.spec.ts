import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { ConfigService } from '../config/config.service';

describe('AppService', () => {
  let service: AppService;
  let configService: any;

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('root', () => {
      it('should return app url', () => {
          expect(service.root()).toBe('http://localhost:3000');
          expect(configService.get).toHaveBeenCalledWith('APP_URL');
      });
  });
});
