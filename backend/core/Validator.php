<?php
/**
 * Tiny validator. Rules: required, email, max:N, min:N, int, in:a,b,c
 *   $errors = Validator::make($data, ['name' => 'required|max:150', 'email' => 'email']);
 */
class Validator
{
    public static function make(array $data, array $rules): array
    {
        $errors = [];
        foreach ($rules as $field => $ruleString) {
            $value = $data[$field] ?? null;
            $str   = is_scalar($value) ? trim((string) $value) : '';
            $label = ucfirst(str_replace('_', ' ', $field));

            foreach (explode('|', $ruleString) as $rule) {
                [$name, $arg] = array_pad(explode(':', $rule, 2), 2, null);
                $empty = $str === '';
                $msg = null;
                switch ($name) {
                    case 'required': if ($empty) $msg = "$label is required."; break;
                    case 'email':    if (!$empty && !filter_var($str, FILTER_VALIDATE_EMAIL)) $msg = "Enter a valid email address."; break;
                    case 'max':      if (mb_strlen($str) > (int) $arg) $msg = "$label must be at most $arg characters."; break;
                    case 'min':      if (!$empty && mb_strlen($str) < (int) $arg) $msg = "$label must be at least $arg characters."; break;
                    case 'int':      if (!$empty && filter_var($str, FILTER_VALIDATE_INT) === false) $msg = "$label must be a number."; break;
                    case 'phone':    if (!$empty && !preg_match('/^[0-9+\-\s()]{7,20}$/', $str)) $msg = "Enter a valid phone number."; break;
                    case 'alpha':    if (!$empty && !preg_match('/^[A-Za-z]+(?: [A-Za-z]+)*$/', $str)) $msg = "$label can contain only letters and spaces."; break;
                    case 'mobile':   if (!$empty && !preg_match('/^[6-9][0-9]{9}$/', $str)) $msg = "Enter a valid 10-digit mobile number (numbers only)."; break;
                    case 'in':       if (!$empty && !in_array($str, explode(',', $arg), true)) $msg = "$label has an invalid value."; break;
                }
                if ($msg) { $errors[$field] = $msg; break; }
            }
        }
        return $errors;
    }
}
