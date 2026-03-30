<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260330150004 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE retweet DROP FOREIGN KEY `FK_45E67DB3331E048A`');
        $this->addSql('ALTER TABLE retweet CHANGE original_tweet_id original_tweet_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE retweet ADD CONSTRAINT FK_45E67DB3331E048A FOREIGN KEY (original_tweet_id) REFERENCES tweet (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE retweet DROP FOREIGN KEY FK_45E67DB3331E048A');
        $this->addSql('ALTER TABLE retweet CHANGE original_tweet_id original_tweet_id INT NOT NULL');
        $this->addSql('ALTER TABLE retweet ADD CONSTRAINT `FK_45E67DB3331E048A` FOREIGN KEY (original_tweet_id) REFERENCES tweet (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
    }
}
