<?php
/**
 * Content definitions.
 *
 * "collections" = repeatable cards managed in the admin (list, add, edit, reorder, hide).
 * "sections"    = single-record content blocks stored as JSON in the `sections` table.
 *
 * Field types: string | text | image | int | bool
 * Every collection table also has: id, sort_order, is_active, created_at, updated_at
 */
return [
    'collections' => [
        'capabilities' => [
            'table'  => 'capabilities',
            'label'  => 'Capability',
            'fields' => [
                'title'       => ['type' => 'string', 'required' => true, 'max' => 150],
                'description' => ['type' => 'text'],
                'image'       => ['type' => 'image'],
                'image_alt'   => ['type' => 'string', 'max' => 255],
                'icon'        => ['type' => 'string', 'max' => 50],
                'link_text'   => ['type' => 'string', 'max' => 100],
            ],
        ],
        'services' => [
            'table'  => 'services',
            'label'  => 'Service',
            'fields' => [
                'title'       => ['type' => 'string', 'required' => true, 'max' => 150],
                'tag'         => ['type' => 'string', 'max' => 60],
                'description' => ['type' => 'text'],
                'image'       => ['type' => 'image'],
                'image_alt'   => ['type' => 'string', 'max' => 255],
                'icon'        => ['type' => 'string', 'max' => 50],
                'button_text' => ['type' => 'string', 'max' => 60],
            ],
        ],
        'why_items' => [
            'table'  => 'why_items',
            'label'  => 'Strength',
            'fields' => [
                'title'       => ['type' => 'string', 'required' => true, 'max' => 150],
                'description' => ['type' => 'text'],
                'icon'        => ['type' => 'string', 'max' => 50],
            ],
        ],
        'projects' => [
            'table'  => 'projects',
            'label'  => 'Project',
            'fields' => [
                'title'           => ['type' => 'string', 'required' => true, 'max' => 200],
                'client'          => ['type' => 'string', 'max' => 150],
                'category'        => ['type' => 'string', 'max' => 80],
                'tag'             => ['type' => 'string', 'max' => 80],
                'description'     => ['type' => 'text'],
                'image'           => ['type' => 'image'],
                'image_alt'   => ['type' => 'string', 'max' => 255],
                'link_text'       => ['type' => 'string', 'max' => 80],
                'is_featured'     => ['type' => 'bool'],
                'is_illustrative' => ['type' => 'bool'],
            ],
        ],
        'process_steps' => [
            'table'  => 'process_steps',
            'label'  => 'Step',
            'fields' => [
                'title'       => ['type' => 'string', 'required' => true, 'max' => 150],
                'description' => ['type' => 'text'],
                'phase'       => ['type' => 'string', 'max' => 60],
                'icon'        => ['type' => 'string', 'max' => 50],
            ],
        ],
        'testimonials' => [
            'table'  => 'testimonials',
            'label'  => 'Testimonial',
            'fields' => [
                'name'    => ['type' => 'string', 'required' => true, 'max' => 150],
                'role'    => ['type' => 'string', 'max' => 150],
                'company' => ['type' => 'string', 'max' => 150],
                'message' => ['type' => 'text', 'required' => true],
                'rating'  => ['type' => 'int', 'min' => 1, 'max' => 5],
                'avatar'  => ['type' => 'image'],
            ],
        ],
    ],

    'sections' => [
        'hero', 'capabilities', 'about', 'services', 'equipment', 'panel_feature', 'why', 'projects',
        'process', 'testimonials', 'cta', 'faq', 'contact', 'settings', 'legal',
    ],
];
