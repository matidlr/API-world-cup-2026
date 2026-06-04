import { Controller, Get, Query, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AbstractBaseService } from 'src/basic/abstract-base.service';
import { AbstractController } from 'src/basic/abstract.controller';
import { PlayFinalService } from '../services/play-final.service';
import { PlayFinalModel, WorldCupStatusResponse } from '../model/play-final-service.model';

@ApiTags('final-match')
@Controller('final-match')
export class PlayFinalController extends AbstractController {
  constructor(private readonly playFinalService: PlayFinalService){super()}

@Get('current')
     @ApiOperation({ summary: 'Play final- Cuurent final' })
     @ApiQuery({ name: 'lang', required: false, enum: ['es', 'en'] })
     public async getFinal(@Query('lang') lang?: string): Promise<unknown> {
       return this.createOkResponse(await this.playFinalService.getWorldCupStatus(lang));
     }

  @Post('play-final')
  @HttpCode(HttpStatus.OK) // Cambia el estado por defecto de un POST (21) a 200 OK
  @ApiOperation({ summary: 'Play final - Start the final' })
  @ApiQuery({ 
    name: 'lang', 
    required: false, 
    enum: ['es', 'en'], 
    description: 'Idioma para los comentarios y eventos del partido (por defecto "es")' 
  })

  @ApiResponse({ status: 200, description: 'La final se inició correctamente y devuelve los datos del partido.' })
  
  async playFinal(
    @Query('lang') lang?: string 
  ) {
    return await this.playFinalService.startFinal(lang);
  }

 @Post('play-turn')
 @ApiOperation({ summary: 'Play Final - Play one turn' })
 @ApiBody({
  schema: {
    type: 'object',
    properties: {
      selectedOption: { type: 'number', example: 2, minimum: 1, maximum: 4 },
      lang:           { type: 'string', enum: ['es', 'en'], example: 'en' },
    },
    required: ['selectedOption'],
  },
})
public async playTurn(
  @Body('selectedOption') selectedOption: number,
  @Body('lang') lang?: string,
): Promise<unknown> {
  return this.createOkResponse(
    await this.playFinalService.postPlayTurn(selectedOption, lang));
}

@Post('select-strategy')
@ApiOperation({ summary: 'Play Final - Select strategy' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      strategy: { type: 'string', example: 'ATTACK' },
      lang:     { type: 'string', enum: ['es', 'en'] },
    },
    required: ['strategy'],
  },
})
public async selectStrategy(
  @Body('strategy') strategy: string,
  @Body('lang') lang?: string,
): Promise<unknown> {
  return this.createOkResponse(
    await this.playFinalService.selectStrategy(strategy, lang)
  );
}

 @Post('formations')
@ApiOperation({ summary: 'Play Final - Select formations' })
 @ApiQuery({ name: 'lang', required: false, enum: ['es', 'en'] })
 @ApiBody({
  schema: {
    type: 'object',
    properties: {
      formation: { type: 'string', example: '4-3-3' },
      lang:      { type: 'string', enum: ['es', 'en'] },
    },
    required: ['formation'],
  },
})
 public async selectFormations( @Body('formation') formation: string,
                                @Body('lang') lang?: string): Promise<unknown> {
  return this.createOkResponse(
    await this.playFinalService.selectFormation(formation, lang));
 }


}
