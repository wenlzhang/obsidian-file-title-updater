// Simple test script to verify the title updating logic
const fs = require('fs');
const path = require('path');

// Test file path
const testFilePath = path.join(__dirname, 'test-note.md');

// Read the test file
let fileContent = fs.readFileSync(testFilePath, 'utf8');
console.log('Original file content:');
console.log('-------------------');
console.log(fileContent);
console.log('-------------------\n');

// Test functions
function updateFileContents(content, title) {
    let updatedContent = content;
    
    // Update frontmatter title
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const frontmatterMatch = content.match(frontmatterRegex);
    
    if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const titleRegex = /^title:\s*(.*)$/m;
        const titleMatch = frontmatter.match(titleRegex);
        
        if (titleMatch) {
            // Update existing title
            updatedContent = updatedContent.replace(
                titleRegex,
                `title: ${title}`
            );
        } else {
            // Add title to existing frontmatter
            updatedContent = updatedContent.replace(
                frontmatterRegex,
                `---\ntitle: ${title}\n$1\n---\n`
            );
        }
    } else {
        // Add new frontmatter with title
        updatedContent = `---\ntitle: ${title}\n---\n\n${updatedContent}`;
    }
    
    // Update or add first level 1 heading
    const headingRegex = /^#\s+(.+)$/m;
    const headingMatch = updatedContent.match(headingRegex);
    
    if (headingMatch) {
        // Update existing heading
        updatedContent = updatedContent.replace(
            headingRegex,
            `# ${title}`
        );
    } else {
        // Add heading after frontmatter
        const afterFrontmatter = updatedContent.indexOf('---\n') !== -1 
            ? updatedContent.indexOf('---\n') + 4 
            : 0;
            
        if (afterFrontmatter > 0) {
            const beforeHeading = updatedContent.substring(0, afterFrontmatter);
            const afterHeading = updatedContent.substring(afterFrontmatter);
            updatedContent = `${beforeHeading}\n# ${title}\n\n${afterHeading.trim()}`;
        } else {
            updatedContent = `# ${title}\n\n${updatedContent}`;
        }
    }
    
    return updatedContent;
}

// Test 1: Update from filename
console.log('Test 1: Update from filename "New Title From Filename"');
const updatedContent1 = updateFileContents(fileContent, 'New Title From Filename');
console.log('Updated content:');
console.log('-------------------');
console.log(updatedContent1);
console.log('-------------------\n');

// Test 2: Update from frontmatter
console.log('Test 2: Update from frontmatter "New Title From Frontmatter"');
// First add a title to frontmatter for this test
let contentWithFrontmatterTitle = fileContent.replace(
    /^---\s*\n/,
    '---\ntitle: Existing Frontmatter Title\n'
);
const updatedContent2 = updateFileContents(contentWithFrontmatterTitle, 'New Title From Frontmatter');
console.log('Updated content:');
console.log('-------------------');
console.log(updatedContent2);
console.log('-------------------\n');

// Test 3: Update from heading
console.log('Test 3: Update from heading "New Title From Heading"');
const updatedContent3 = updateFileContents(fileContent, 'New Title From Heading');
console.log('Updated content:');
console.log('-------------------');
console.log(updatedContent3);
console.log('-------------------\n');

console.log('All tests completed. Please check the results above.');
