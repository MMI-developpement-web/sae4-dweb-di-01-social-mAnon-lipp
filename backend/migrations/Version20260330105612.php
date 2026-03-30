<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260330105612 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE retweet (id INT AUTO_INCREMENT NOT NULL, content VARCHAR(280) NOT NULL, created_at DATETIME NOT NULL, original_tweet_id INT NOT NULL, author_id INT NOT NULL, INDEX IDX_45E67DB3331E048A (original_tweet_id), INDEX IDX_45E67DB3F675F31B (author_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE retweet ADD CONSTRAINT FK_45E67DB3331E048A FOREIGN KEY (original_tweet_id) REFERENCES tweet (id)');
        $this->addSql('ALTER TABLE retweet ADD CONSTRAINT FK_45E67DB3F675F31B FOREIGN KEY (author_id) REFERENCES `user` (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE retweet DROP FOREIGN KEY FK_45E67DB3331E048A');
        $this->addSql('ALTER TABLE retweet DROP FOREIGN KEY FK_45E67DB3F675F31B');
        $this->addSql('DROP TABLE retweet');
    }
}
