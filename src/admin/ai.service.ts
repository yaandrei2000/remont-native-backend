import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpsProxyAgent } from 'https-proxy-agent';
import OpenAI from 'openai';
import * as undici from 'undici';

@Injectable()
export class AiService {
    private readonly openai: OpenAI

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');

    const proxyUrl = this.configService.getOrThrow<string>('HTTP_PROXY');

    const agent = new undici.ProxyAgent(proxyUrl);

    this.openai = new OpenAI({
        apiKey,
        fetchOptions: {
            dispatcher: agent,
          },
    });
  }

  // async generateSlug(name: string): Promise<string> {
  //   if (!this.openai) {
  //     // Fallback: простая транслитерация если OpenAI не настроен
  //     return this.generateSlugFallback(name);
  //   }

  //   try {
  //     const completion = await this.openai.chat.completions.create({
  //       model: 'gpt-4o-mini',
  //       messages: [
  //         {
  //           role: 'system',
  //           content: 'Ты помощник для генерации URL-friendly slug из русского названия. Отвечай ТОЛЬКО slug в формате lowercase с дефисами, без дополнительных объяснений. Пример: "Ремонт сантехники" -> "plumbing-repair"',
  //         },
  //         {
  //           role: 'user',
  //           content: `Сгенерируй slug для: "${name}"`,
  //         },
  //       ],
  //       temperature: 0.3,
  //       max_tokens: 50,
  //     });

  //     const slug = completion.choices[0]?.message?.content?.trim() || this.generateSlugFallback(name);
  //     // Очищаем от возможных кавычек и лишних символов
  //     return slug.replace(/['"]/g, '').toLowerCase();
  //   } catch (error) {
  //     console.error('OpenAI API error:', error);
  //     return this.generateSlugFallback(name);
  //   }
  // }

  async generateSlug(name: string): Promise<string> {
    return this.generateSlugFallback(name);
  }

  async generateDescription(name: string, type: 'category' | 'service', categories?: string[]): Promise<string> {
    if (!this.openai) {
      return this.generateDescriptionFallback(name, type);
    }

    try {
      if (type === 'service') {
        // Для услуг используем специальный формат
        let categoryContext = '';
        if (categories && categories.length > 0) {
          const categoryPath = categories.join(' => ');
          categoryContext = `\n\nУслуга находится в категории: ${categoryPath}`;
        }

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Ты помощник для генерации описания. Описание должно включать: что делает мастер, какие действия выполняет, примерное время работы. Описание должно быть информативным, понятным для клиента и привлекательным. Учитывай контекст категории, в которой находится услуга. Отвечай ТОЛЬКО в указанном формате, без дополнительных объяснений.\n\nПример: Мастер полностью отключит стиральную машину от питания и воды. Разберет корпус, чтобы комплексно прочистить сливы, фильтры и насосы. В конце подключит и проверит работу устройства. Засор устраним примерно за 1-2 часа.',
            },
            {
              role: 'user',
              content: `Сгенерируй описание для услуги: "${name}"${categoryContext}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 200,
        });

        return completion.choices[0]?.message?.content?.trim() || this.generateDescriptionFallback(name, type);
      } else {
        // Для категорий используем простой формат
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Ты помощник для генерации краткого описания категории услуг на русском языке. Описание должно быть 2-3 предложения, информативным и привлекательным для клиентов. Отвечай ТОЛЬКО описанием, без дополнительных объяснений.',
            },
            {
              role: 'user',
              content: `Сгенерируй описание для категории: "${name}"`,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        });

        return completion.choices[0]?.message?.content?.trim() || this.generateDescriptionFallback(name, type);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateDescriptionFallback(name, type);
    }
  }

  private generateSlugFallback(name: string): string {
    // Простая транслитерация кириллицы в латиницу
    const transliterationMap: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
      и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
      с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
      ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    };

    return name
      .toLowerCase()
      .split('')
      .map((char) => transliterationMap[char] || char)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateDescriptionFallback(name: string, type: 'category' | 'service'): string {
    if (type === 'category') {
      return `Категория "${name}" включает в себя широкий спектр профессиональных услуг. Наши специалисты готовы помочь вам с решением любых задач в этой области.`;
    } else {
      return `Название: ${name}\n\nОписание: Мастер выполнит все необходимые работы для решения проблемы. Проведет диагностику, выполнит ремонт или обслуживание с использованием качественных материалов и инструментов. Работы будут выполнены профессионально и в кратчайшие сроки.`;
    }
  }
}

