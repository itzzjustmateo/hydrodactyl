<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Closure;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class LogoFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'logo_file' => 'nullable|file|mimes:png,jpg,jpeg,gif,webp,svg|max:2048',
            'logo_url' => 'nullable|url|max:2048',
            'remove' => 'nullable|boolean',
            'rewind' => 'nullable|integer|min:0',
            'app:name' => 'nullable|string|max:191',
            'app:brand_color' => ['nullable', 'string', 'max:7', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/'],
            'app:custom_nav_items' => 'array|max:3',
            'app:custom_nav_items.*.label' => 'nullable|string|max:32',
            'app:custom_nav_items.*.url' => [
                'nullable',
                'string',
                'max:2048',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (!is_string($value) || $value === '') {
                        return;
                    }

                    $scheme = parse_url($value, PHP_URL_SCHEME);

                    if (
                        str_starts_with($value, '/') ||
                        (in_array($scheme, ['http', 'https'], true) && filter_var($value, FILTER_VALIDATE_URL) !== false)
                    ) {
                        return;
                    }

                    $fail('The :attribute must be an HTTP(S) URL or internal path.');
                },
            ],
            'app:custom_nav_items.*.icon' => 'nullable|string|in:link,book,globe,help,home,store,discord,document,terminal,rocket',
        ];
    }

    public function normalize(?array $only = null): array
    {
        $items = collect($this->input('app:custom_nav_items', []))
            ->take(3)
            ->map(function (array $item): ?array {
                $label = trim((string) ($item['label'] ?? ''));
                $url = trim((string) ($item['url'] ?? ''));
                $icon = trim((string) ($item['icon'] ?? 'link'));

                if ($label === '' && $url === '') {
                    return null;
                }

                return [
                    'label' => $label,
                    'url' => $url,
                    'icon' => $icon !== '' ? $icon : 'link',
                ];
            })
            ->filter()
            ->values()
            ->toArray();

        return [
            'app:custom_nav_items' => json_encode($items),
        ];
    }

    public function attributes(): array
    {
        return [
            'logo_file' => 'Logo File',
            'logo_url' => 'Logo URL',
            'app:name' => 'Company Name',
            'app:brand_color' => 'Brand Color',
            'app:custom_nav_items.*.label' => 'Custom Nav Item Label',
            'app:custom_nav_items.*.url' => 'Custom Nav Item Link',
            'app:custom_nav_items.*.icon' => 'Custom Nav Item Icon',
        ];
    }

    public function messages(): array
    {
        return [
            'logo_file.mimes' => 'The logo must be a PNG, JPG, GIF, WEBP, or SVG file.',
            'logo_file.max' => 'The logo must not exceed 2MB in size.',
            'logo_url.url' => 'The logo URL must be a valid URL.',
            'app:brand_color.regex' => 'The brand color must be a valid hex color (e.g. #52A9FF).',
        ];
    }
}
