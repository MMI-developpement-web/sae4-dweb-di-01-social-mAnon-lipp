<?php

namespace App\Trait;

use Symfony\Component\HttpFoundation\Request;

/**
 * Parse multipart/form-data for non-POST requests (like PUT)
 * Symfony only auto-parses multipart for POST, so we handle PUT manually
 */
trait ParseMultipartTrait
{
    /**
     * Parse multipart form data from request body
     * Returns array with both 'files' and 'fields'
     */
    protected function parseMultipartRequest(Request $request): array
    {
        $contentType = $request->headers->get('Content-Type', '');
        if (!str_starts_with($contentType, 'multipart/form-data')) {
            error_log("DEBUG: Not multipart");
            return ['files' => [], 'fields' => []];
        }

        // Extract boundary from Content-Type header
        preg_match('/boundary=([^;]+)/', $contentType, $matches);
        if (!isset($matches[1])) {
            error_log("DEBUG: No boundary found");
            return ['files' => [], 'fields' => []];
        }

        $boundary = trim($matches[1], '"');
        error_log("DEBUG: Boundary found, length: " . strlen($boundary) . " chars");
        
        $rawBody = $request->getContent();
        error_log("DEBUG: Raw body size: " . strlen($rawBody) . " bytes");
        
        $files = [];
        $fields = [];

        // Split by boundary
        $parts = explode('--' . $boundary, $rawBody);
        error_log("DEBUG: Parts count: " . count($parts));

        foreach ($parts as $idx => $part) {
            if (empty(trim($part)) || $part === '--') {
                continue;
            }

            // Split headers from content
            $headerEnd = strpos($part, "\r\n\r\n");
            if ($headerEnd === false) {
                $headerEnd = strpos($part, "\n\n");
                $eol = "\n";
            } else {
                $eol = "\r\n";
            }

            if ($headerEnd === false) {
                error_log("DEBUG: Part $idx - No header end found");
                continue;
            }

            $headers = substr($part, 0, $headerEnd);
            $content = substr($part, $headerEnd + strlen($eol . $eol));
            
            // Remove trailing boundary markers and newlines
            $content = rtrim($content, "\r\n--");
            $content = rtrim($content, "\n--");

            // Parse Content-Disposition header
            preg_match('/name="([^"]+)"/', $headers, $nameMatches);
            $name = $nameMatches[1] ?? null;

            if (preg_match('/filename="([^"]+)"/', $headers, $filenameMatches)) {
                // It's a file
                $filename = $filenameMatches[1];
                
                // Get MIME type
                preg_match('/Content-Type:\s*([^\r\n]+)/', $headers, $typeMatches);
                $mimeType = $typeMatches[1] ?? 'application/octet-stream';

                if ($name && $filename && !empty($content)) {
                    // Create a temporary file
                    $tmpPath = tempnam(sys_get_temp_dir(), 'upload_');
                    error_log("DEBUG: Creating temp file: $tmpPath");
                    
                    $bytesWritten = file_put_contents($tmpPath, $content);
                    error_log("DEBUG: File - name=$name, filename=$filename, size=" . strlen($content) . ", written=$bytesWritten, tmp=$tmpPath");

                    if ($bytesWritten !== false && file_exists($tmpPath)) {
                        error_log("DEBUG: Temp file verified to exist: $tmpPath (size: " . filesize($tmpPath) . ")");
                        $files[$name] = [
                            'name' => $filename,
                            'type' => $mimeType,
                            'tmp_name' => $tmpPath,
                            'size' => strlen($content),
                            'error' => 0,
                        ];
                    } else {
                        error_log("ERROR: Failed to create temp file or verify it");
                    }
                } else {
                    error_log("DEBUG: Skipped file - name=$name, filename=$filename, content_empty=" . empty($content));
                }
            } else {
                // It's a field
                if ($name) {
                    // Remove leading/trailing newlines
                    $content = trim($content, "\r\n");
                    $fields[$name] = $content;
                    error_log("DEBUG: Field - name=$name, length=" . strlen($content) . ", value=" . substr($content, 0, 50));
                }
            }
        }

        error_log("DEBUG: Parsing complete - files: " . count($files) . ", fields: " . count($fields));
        return ['files' => $files, 'fields' => $fields];
    }
}