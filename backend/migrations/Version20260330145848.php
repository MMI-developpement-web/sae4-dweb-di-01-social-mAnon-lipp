<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260330145848 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Make original_tweet_id nullable in retweet table and set onDelete to SET NULL';
    }

    public function up(Schema $schema): void
    {
        // Drop the existing foreign key constraint
        $this->addSql('ALTER TABLE retweet DROP FOREIGN KEY FK_45E67DB3331E048A');
        
        // Make the column nullable
        $this->addSql('ALTER TABLE retweet CHANGE original_tweet_id original_tweet_id INT DEFAULT NULL');
        
        // Re-create the foreign key constraint with onDelete: SET NULL
        $this->addSql('ALTER TABLE retweet ADD CONSTRAINT FK_45E67DB3331E048A FOREIGN KEY (original_tweet_id) REFERENCES tweet (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // Drop the foreign key constraint
        $this->addSql('ALTER TABLE retweet DROP FOREIGN KEY FK_45E67DB3331E048A');
        
        // Make the column NOT NULL again
        $this->addSql('ALTER TABLE retweet CHANGE original_tweet_id original_tweet_id INT NOT NULL');
        
        // Re-create the foreign key constraint without onDelete
        $this->addSql('ALTER TABLE retweet ADD CONSTRAINT FK_45E67DB3331E048A FOREIGN KEY (original_tweet_id) REFERENCES tweet (id)');
    }
}
